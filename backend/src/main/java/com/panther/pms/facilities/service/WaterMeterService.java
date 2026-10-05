package com.panther.pms.facilities.service;

import com.panther.pms.common.audit.ActivityType;
import com.panther.pms.common.audit.AuditService;
import com.panther.pms.common.exception.ConflictException;
import com.panther.pms.common.exception.ResourceNotFoundException;
import com.panther.pms.facilities.dto.AssignWaterMeterRequest;
import com.panther.pms.facilities.dto.RecordWaterMeterPaymentRequest;
import com.panther.pms.facilities.dto.UpdateWaterMeterReadingRequest;
import com.panther.pms.facilities.dto.WaterMeterReadingResponse;
import com.panther.pms.facilities.dto.WaterMeterResponse;
import com.panther.pms.facilities.entity.WaterMeter;
import com.panther.pms.facilities.entity.WaterMeterReading;
import com.panther.pms.facilities.entity.WaterPaymentStatus;
import com.panther.pms.facilities.repository.WaterMeterRepository;
import com.panther.pms.finance.entity.Payment;
import com.panther.pms.finance.entity.PaymentStatus;
import com.panther.pms.finance.entity.PaymentType;
import com.panther.pms.finance.repository.PaymentRepository;
import com.panther.pms.iam.service.SystemSettingsService;
import com.panther.pms.leasing.entity.Client;
import com.panther.pms.leasing.repository.ClientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.Year;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class WaterMeterService {

    private final WaterMeterRepository waterMeterRepository;
    private final ClientRepository clientRepository;
    private final PaymentRepository paymentRepository;
    private final SystemSettingsService systemSettingsService;
    private final AuditService auditService;

    public List<WaterMeterResponse> list() {
        return waterMeterRepository.findAll().stream().map(this::toResponse).toList();
    }

    public WaterMeterResponse get(Long id) {
        return toResponse(findOrThrow(id));
    }

    public WaterMeterResponse getByClient(Long clientId) {
        return toResponse(waterMeterRepository.findByClientId(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("No water meter assigned to this resident.")));
    }

    @Transactional
    public WaterMeterResponse assign(AssignWaterMeterRequest request) {
        Client client = clientRepository.findById(request.clientId())
                .orElseThrow(() -> ResourceNotFoundException.of("Client", request.clientId()));
        if (client.getCurrentRoom() == null || client.getCurrentProperty() == null) {
            throw new ConflictException("This resident has no current room/property assigned yet.");
        }
        if (waterMeterRepository.existsByMeterNumber(request.meterNumber())) {
            throw new ConflictException("Meter number " + request.meterNumber() + " is already assigned.");
        }

        BigDecimal initialReading = request.initialReading() != null ? request.initialReading() : BigDecimal.ZERO;
        BigDecimal rate = request.ratePerM3() != null
                ? request.ratePerM3()
                : systemSettingsService.get().waterRatePerM3();

        WaterMeter meter = WaterMeter.builder()
                .property(client.getCurrentProperty())
                .room(client.getCurrentRoom())
                .client(client)
                .meterNumber(request.meterNumber())
                .previousReading(initialReading)
                .currentReading(initialReading)
                .consumptionM3(BigDecimal.ZERO)
                .readingDate(LocalDate.now())
                .ratePerM3(rate)
                .totalAmount(BigDecimal.ZERO)
                .paymentStatus(WaterPaymentStatus.PAID)
                .build();

        meter = waterMeterRepository.save(meter);
        auditService.log("Water Meter Assigned", "Water Meters", "Assigned meter " + meter.getMeterNumber()
                + " to " + client.getName(), ActivityType.INFO);
        return toResponse(meter);
    }

    @Transactional
    public WaterMeterResponse updateReading(Long meterId, UpdateWaterMeterReadingRequest request) {
        WaterMeter meter = findOrThrow(meterId);

        BigDecimal previousReading = request.newBillingCycle() ? meter.getCurrentReading() : meter.getPreviousReading();
        BigDecimal consumption = request.currentReading().subtract(previousReading).max(BigDecimal.ZERO);
        BigDecimal totalAmount = consumption.multiply(meter.getRatePerM3()).setScale(2, RoundingMode.HALF_UP);

        if (request.newBillingCycle() && meter.getConsumptionM3().compareTo(BigDecimal.ZERO) > 0) {
            String label = LocalDate.now().getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH) + " " + Year.now().getValue();
            meter.getHistory().add(0, WaterMeterReading.builder()
                    .waterMeter(meter)
                    .periodMonth(label)
                    .reading(meter.getCurrentReading())
                    .consumption(meter.getConsumptionM3())
                    .amount(meter.getTotalAmount())
                    .build());
        }

        meter.setPreviousReading(previousReading);
        meter.setCurrentReading(request.currentReading());
        meter.setConsumptionM3(consumption);
        meter.setTotalAmount(totalAmount);
        meter.setReadingDate(LocalDate.now());
        meter.setPaymentStatus(totalAmount.compareTo(BigDecimal.ZERO) > 0 ? WaterPaymentStatus.PENDING : WaterPaymentStatus.PAID);

        // `meter` is already managed here, so save() would merge() rather than persist() for the
        // newly-added history row — flush() instead (see BACKEND_PLAN.md section 10, Phase 3).
        waterMeterRepository.flush();
        auditService.log("Water Reading Updated", "Water Meters", "Updated meter " + meter.getMeterNumber()
                + " reading to " + request.currentReading() + " m3", ActivityType.INFO);
        return toResponse(meter);
    }

    @Transactional
    public WaterMeterResponse recordPayment(Long meterId, RecordWaterMeterPaymentRequest request) {
        WaterMeter meter = findOrThrow(meterId);
        meter.setPaymentStatus(WaterPaymentStatus.PAID);

        if (meter.getTotalAmount().compareTo(BigDecimal.ZERO) > 0) {
            Payment payment = Payment.builder()
                    .invoiceNumber(generateUniqueInvoiceNumber())
                    .client(meter.getClient())
                    .property(meter.getProperty())
                    .room(meter.getRoom())
                    .amount(meter.getTotalAmount())
                    .date(LocalDate.now())
                    .dueDate(LocalDate.now())
                    .type(PaymentType.UTILITY)
                    .method(request.paymentMethod())
                    .reference(request.reference() != null && !request.reference().isBlank()
                            ? request.reference() : "WTR-" + System.currentTimeMillis())
                    .status(PaymentStatus.PAID)
                    .notes("Water utility bill settlement for meter " + meter.getMeterNumber()
                            + " (" + meter.getConsumptionM3() + " m3)")
                    .build();
            paymentRepository.save(payment);
            auditService.log("Water Utility Paid", "Water Meters", "Recorded $" + meter.getTotalAmount()
                    + " water bill payment for " + meter.getClient().getName(), ActivityType.SUCCESS);
        }

        return toResponse(waterMeterRepository.save(meter));
    }

    private String generateUniqueInvoiceNumber() {
        String year = String.valueOf(Year.now().getValue());
        String candidate;
        int attempt = (int) paymentRepository.count() + 1;
        do {
            candidate = "INV-" + year + "-" + String.format("%04d", attempt++);
        } while (paymentRepository.existsByInvoiceNumber(candidate));
        return candidate;
    }

    private WaterMeterResponse toResponse(WaterMeter m) {
        List<WaterMeterReadingResponse> history = m.getHistory().stream()
                .map(h -> new WaterMeterReadingResponse(h.getPeriodMonth(), h.getReading(), h.getConsumption(), h.getAmount()))
                .toList();

        return new WaterMeterResponse(m.getId(), m.getProperty().getId(), m.getProperty().getName(),
                m.getRoom().getId(), m.getRoom().getRoomNumber(), m.getClient().getId(), m.getClient().getName(),
                m.getMeterNumber(), m.getPreviousReading(), m.getCurrentReading(), m.getConsumptionM3(),
                m.getReadingDate(), m.getRatePerM3(), m.getTotalAmount(), m.getPaymentStatus(), history);
    }

    private WaterMeter findOrThrow(Long id) {
        return waterMeterRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("WaterMeter", id));
    }
}
