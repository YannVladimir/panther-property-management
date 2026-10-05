package com.panther.pms.finance.controller;

import com.panther.pms.common.PageResponse;
import com.panther.pms.finance.dto.BillPaymentResponse;
import com.panther.pms.finance.dto.CreateBillPaymentRequest;
import com.panther.pms.finance.dto.CreateRecurringBillRequest;
import com.panther.pms.finance.dto.RecurringBillResponse;
import com.panther.pms.finance.dto.UpdateRecurringBillRequest;
import com.panther.pms.finance.entity.RecurringBillStatus;
import com.panther.pms.finance.service.RecurringBillService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/recurring-bills")
@RequiredArgsConstructor
public class RecurringBillController {

    private final RecurringBillService recurringBillService;

    @GetMapping
    @PreAuthorize("hasAnyRole('OPERATIONS', 'OWNER')")
    public PageResponse<RecurringBillResponse> list(@RequestParam(required = false) Long propertyId,
                                                     @RequestParam(required = false) RecurringBillStatus status,
                                                     Pageable pageable) {
        return recurringBillService.list(propertyId, status, pageable);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OPERATIONS', 'OWNER')")
    public RecurringBillResponse get(@PathVariable Long id) {
        return recurringBillService.get(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('OPERATIONS')")
    public RecurringBillResponse create(@Valid @RequestBody CreateRecurringBillRequest request) {
        return recurringBillService.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('OPERATIONS')")
    public RecurringBillResponse update(@PathVariable Long id, @Valid @RequestBody UpdateRecurringBillRequest request) {
        return recurringBillService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('OPERATIONS')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        recurringBillService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/payments")
    @PreAuthorize("hasRole('OPERATIONS')")
    public BillPaymentResponse addPayment(@PathVariable Long id, @Valid @RequestBody CreateBillPaymentRequest request) {
        return recurringBillService.addPayment(id, request);
    }

    @PatchMapping("/{id}/mark-paid")
    @PreAuthorize("hasRole('OPERATIONS')")
    public RecurringBillResponse markPaid(@PathVariable Long id) {
        return recurringBillService.markPaid(id);
    }
}
