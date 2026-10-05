package com.panther.pms.finance.controller;

import com.panther.pms.common.PageResponse;
import com.panther.pms.finance.dto.CreatePaymentRequest;
import com.panther.pms.finance.dto.PaymentResponse;
import com.panther.pms.finance.entity.PaymentStatus;
import com.panther.pms.finance.entity.PaymentType;
import com.panther.pms.finance.service.PaymentService;
import com.panther.pms.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PostAuthorize;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @GetMapping
    @PreAuthorize("hasRole('OPERATIONS')")
    public PageResponse<PaymentResponse> list(@RequestParam(required = false) Long clientId,
                                               @RequestParam(required = false) Long propertyId,
                                               @RequestParam(required = false) PaymentType type,
                                               @RequestParam(required = false) PaymentStatus status,
                                               @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                               @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
                                               @RequestParam(required = false) String search,
                                               Pageable pageable) {
        return paymentService.list(clientId, propertyId, type, status, from, to, search, pageable);
    }

    @GetMapping("/{id}")
    @PostAuthorize("hasRole('OPERATIONS') or (hasRole('CLIENT') and returnObject.clientId == principal.clientId)")
    public PaymentResponse get(@PathVariable Long id) {
        return paymentService.get(id);
    }

    /**
     * "My Payments" history (ClientPaymentsPage). Kept in this controller rather than under
     * /clients/me/payments to avoid a leasing → finance circular package dependency
     * (finance already depends on leasing.Client) — same rationale as
     * PayrollRecordController#mine in Phase 4.
     */
    @GetMapping("/me")
    @PreAuthorize("hasRole('CLIENT')")
    public PageResponse<PaymentResponse> mine(@AuthenticationPrincipal UserPrincipal principal, Pageable pageable) {
        return paymentService.listByClient(principal.getClientId(), pageable);
    }

    @PostMapping
    @PreAuthorize("hasRole('OPERATIONS')")
    public PaymentResponse create(@Valid @RequestBody CreatePaymentRequest request) {
        return paymentService.create(request);
    }
}
