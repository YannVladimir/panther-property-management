package com.panther.pms.finance.controller;

import com.panther.pms.common.PageResponse;
import com.panther.pms.finance.dto.CreatePayrollRecordRequest;
import com.panther.pms.finance.dto.PayrollRecordResponse;
import com.panther.pms.finance.service.PayrollRecordService;
import com.panther.pms.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/payroll-records")
@RequiredArgsConstructor
public class PayrollRecordController {

    private final PayrollRecordService payrollRecordService;

    @GetMapping
    @PreAuthorize("hasRole('OPERATIONS')")
    public PageResponse<PayrollRecordResponse> list(Pageable pageable) {
        return payrollRecordService.list(pageable);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('OPERATIONS')")
    public PayrollRecordResponse get(@PathVariable Long id) {
        return payrollRecordService.get(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('OPERATIONS')")
    public PayrollRecordResponse create(@Valid @RequestBody CreatePayrollRecordRequest request) {
        return payrollRecordService.create(request);
    }

    @GetMapping("/employee/{employeeId}")
    @PreAuthorize("hasRole('OPERATIONS')")
    public PageResponse<PayrollRecordResponse> byEmployee(@PathVariable Long employeeId, Pageable pageable) {
        return payrollRecordService.listByEmployee(employeeId, pageable);
    }

    /**
     * "My Salary" payslips (HouseholdSalaryPage). Pulled forward from Phase 6's planned
     * /employees/me/payroll since employeeId is already available on the JWT principal
     * (see Phase 1's User.employeeId) and doesn't need the hr.Employee entity to exist yet.
     */
    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('HOUSEHOLD', 'OPERATIONS')")
    public PageResponse<PayrollRecordResponse> mine(@AuthenticationPrincipal UserPrincipal principal, Pageable pageable) {
        return payrollRecordService.listByEmployee(principal.getEmployeeId(), pageable);
    }
}
