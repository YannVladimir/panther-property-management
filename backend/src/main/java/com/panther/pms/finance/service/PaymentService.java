package com.panther.pms.finance.service;

import com.panther.pms.common.PageResponse;
import com.panther.pms.common.audit.ActivityType;
import com.panther.pms.common.audit.AuditService;
import com.panther.pms.common.exception.ResourceNotFoundException;
import com.panther.pms.finance.dto.CreatePaymentRequest;
import com.panther.pms.finance.dto.PaymentResponse;
import com.panther.pms.finance.entity.Payment;
import com.panther.pms.finance.entity.PaymentStatus;
import com.panther.pms.finance.entity.PaymentType;
import com.panther.pms.finance.repository.PaymentRepository;
import com.panther.pms.finance.repository.PaymentSpecifications;
import com.panther.pms.leasing.entity.Client;
import com.panther.pms.leasing.entity.ClientPaymentStatus;
import com.panther.pms.leasing.repository.ClientRepository;
import com.panther.pms.property.entity.Property;
import com.panther.pms.property.entity.Room;
import com.panther.pms.property.repository.PropertyRepository;
import com.panther.pms.property.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Year;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final ClientRepository clientRepository;
    private final PropertyRepository propertyRepository;
    private final RoomRepository roomRepository;
    private final AuditService auditService;

    public PageResponse<PaymentResponse> list(Long clientId, Long propertyId, PaymentType type, PaymentStatus status,
                                               LocalDate from, LocalDate to, String search, Pageable pageable) {
        var page = paymentRepository
                .findAll(PaymentSpecifications.filter(clientId, propertyId, type, status, from, to, search), pageable)
                .map(this::toResponse);
        return PageResponse.of(page);
    }

    public PaymentResponse get(Long id) {
        return toResponse(findOrThrow(id));
    }

    public PageResponse<PaymentResponse> listByClient(Long clientId, Pageable pageable) {
        return PageResponse.of(paymentRepository.findByClientId(clientId, pageable).map(this::toResponse));
    }

    @Transactional
    public PaymentResponse create(CreatePaymentRequest request) {
        Client client = clientRepository.findById(request.clientId())
                .orElseThrow(() -> ResourceNotFoundException.of("Client", request.clientId()));
        Property property = propertyRepository.findById(request.propertyId())
                .orElseThrow(() -> ResourceNotFoundException.of("Property", request.propertyId()));
        Room room = roomRepository.findById(request.roomId())
                .orElseThrow(() -> ResourceNotFoundException.of("Room", request.roomId()));

        PaymentStatus status = request.status() != null ? request.status() : PaymentStatus.PAID;

        Payment payment = Payment.builder()
                .invoiceNumber(generateUniqueInvoiceNumber())
                .client(client)
                .property(property)
                .room(room)
                .amount(request.amount())
                .date(request.date())
                .dueDate(request.dueDate())
                .type(request.type())
                .method(request.method())
                .reference(request.reference())
                .status(status)
                .receiptUrl(request.receiptUrl())
                .notes(request.notes())
                .build();
        payment = paymentRepository.save(payment);

        // Mirrors DataContext.tsx's addPayment side effect exactly.
        if (status == PaymentStatus.PAID && request.type() == PaymentType.RENT) {
            client.setPaymentStatus(ClientPaymentStatus.PAID);
            clientRepository.save(client);
        }

        auditService.log("Payment Recorded", "Finance", "Recorded $" + payment.getAmount() + " ("
                + payment.getType() + ") from " + client.getName(), ActivityType.SUCCESS);
        return toResponse(payment);
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

    private PaymentResponse toResponse(Payment p) {
        return new PaymentResponse(
                p.getId(), p.getInvoiceNumber(), p.getClient().getId(), p.getClient().getName(),
                p.getProperty().getId(), p.getProperty().getName(),
                p.getRoom().getId(), p.getRoom().getRoomNumber(),
                p.getAmount(), p.getDate(), p.getDueDate(), p.getType(), p.getMethod(), p.getReference(),
                p.getStatus(), p.getReceiptUrl(), p.getNotes()
        );
    }

    private Payment findOrThrow(Long id) {
        return paymentRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Payment", id));
    }
}
