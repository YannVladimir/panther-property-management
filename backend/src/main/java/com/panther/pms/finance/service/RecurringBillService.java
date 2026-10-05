package com.panther.pms.finance.service;

import com.panther.pms.common.PageResponse;
import com.panther.pms.common.audit.ActivityType;
import com.panther.pms.common.audit.AuditService;
import com.panther.pms.common.exception.ResourceNotFoundException;
import com.panther.pms.finance.dto.BillPaymentResponse;
import com.panther.pms.finance.dto.CreateBillPaymentRequest;
import com.panther.pms.finance.dto.CreateRecurringBillRequest;
import com.panther.pms.finance.dto.RecurringBillResponse;
import com.panther.pms.finance.dto.UpdateRecurringBillRequest;
import com.panther.pms.finance.entity.BillPayment;
import com.panther.pms.finance.entity.RecurringBill;
import com.panther.pms.finance.entity.RecurringBillStatus;
import com.panther.pms.finance.repository.RecurringBillRepository;
import com.panther.pms.finance.repository.RecurringBillSpecifications;
import com.panther.pms.property.entity.Property;
import com.panther.pms.property.repository.PropertyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RecurringBillService {

    private final RecurringBillRepository recurringBillRepository;
    private final PropertyRepository propertyRepository;
    private final AuditService auditService;

    public PageResponse<RecurringBillResponse> list(Long propertyId, RecurringBillStatus status, Pageable pageable) {
        var page = recurringBillRepository.findAll(RecurringBillSpecifications.filter(propertyId, status), pageable)
                .map(this::toResponse);
        return PageResponse.of(page);
    }

    public RecurringBillResponse get(Long id) {
        return toResponse(findOrThrow(id));
    }

    @Transactional
    public RecurringBillResponse create(CreateRecurringBillRequest request) {
        Property property = propertyRepository.findById(request.propertyId())
                .orElseThrow(() -> ResourceNotFoundException.of("Property", request.propertyId()));

        RecurringBill bill = RecurringBill.builder()
                .property(property)
                .name(request.name())
                .category(request.category())
                .vendor(request.vendor())
                .amount(request.amount())
                .frequency(request.frequency())
                .nextDueDate(request.nextDueDate())
                .autoRenew(request.autoRenew())
                .reminderDays(request.reminderDays())
                .build();

        bill = recurringBillRepository.save(bill);
        auditService.log("Recurring Bill Registered", "Expenses", "Added " + bill.getName() + " ($" + bill.getAmount()
                + "/" + bill.getFrequency() + ") for " + bill.getProperty().getName(), ActivityType.INFO);
        return toResponse(bill);
    }

    @Transactional
    public RecurringBillResponse update(Long id, UpdateRecurringBillRequest request) {
        RecurringBill bill = findOrThrow(id);
        bill.setName(request.name());
        bill.setCategory(request.category());
        bill.setVendor(request.vendor());
        bill.setAmount(request.amount());
        bill.setFrequency(request.frequency());
        bill.setNextDueDate(request.nextDueDate());
        bill.setStatus(request.status());
        bill.setAutoRenew(request.autoRenew());
        bill.setReminderDays(request.reminderDays());
        return toResponse(recurringBillRepository.save(bill));
    }

    @Transactional
    public void delete(Long id) {
        recurringBillRepository.delete(findOrThrow(id));
    }

    @Transactional
    public BillPaymentResponse addPayment(Long billId, CreateBillPaymentRequest request) {
        RecurringBill bill = findOrThrow(billId);
        BillPayment payment = BillPayment.builder()
                .recurringBill(bill)
                .paidDate(request.paidDate())
                .amount(request.amount())
                .method(request.method())
                .reference(request.reference())
                .notes(request.notes())
                .proofUrl(request.proofUrl())
                .build();
        bill.getPayments().add(0, payment);
        bill.setStatus(RecurringBillStatus.PAID);
        // `bill` is already managed in this transaction, so save() would merge() rather than
        // persist() — merging a transient child returns a *new* instance and never sets the id
        // on `payment`. flush() instead, which cascade-persists the existing managed graph in place
        // (see BACKEND_PLAN.md section 10, Phase 3 — the same bug was found and fixed there).
        recurringBillRepository.flush();
        auditService.log("Bill Payment Recorded", "Expenses", "Paid $" + payment.getAmount() + " for bill "
                + bill.getName() + " (" + bill.getProperty().getName() + ")", ActivityType.SUCCESS);
        return toResponse(payment);
    }

    @Transactional
    public RecurringBillResponse markPaid(Long billId) {
        RecurringBill bill = findOrThrow(billId);
        bill.setStatus(RecurringBillStatus.PAID);
        return toResponse(recurringBillRepository.save(bill));
    }

    private RecurringBillResponse toResponse(RecurringBill b) {
        List<BillPaymentResponse> payments = b.getPayments().stream().map(this::toResponse).toList();
        return new RecurringBillResponse(b.getId(), b.getProperty().getId(), b.getProperty().getName(), b.getName(),
                b.getCategory(), b.getVendor(), b.getAmount(), b.getFrequency(), b.getNextDueDate(), b.getStatus(),
                b.isAutoRenew(), b.getReminderDays(), payments);
    }

    private BillPaymentResponse toResponse(BillPayment p) {
        return new BillPaymentResponse(p.getId(), p.getPaidDate(), p.getAmount(), p.getMethod(), p.getReference(),
                p.getNotes(), p.getProofUrl());
    }

    private RecurringBill findOrThrow(Long id) {
        return recurringBillRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("RecurringBill", id));
    }
}
