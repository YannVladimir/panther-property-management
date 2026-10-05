package com.panther.pms.finance.controller;

import com.panther.pms.common.PageResponse;
import com.panther.pms.finance.dto.CreateExpenseRequest;
import com.panther.pms.finance.dto.ExpenseResponse;
import com.panther.pms.finance.dto.UpdateExpenseRequest;
import com.panther.pms.finance.entity.ExpenseCategory;
import com.panther.pms.finance.service.ExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;

    @GetMapping
    @PreAuthorize("hasAnyRole('OPERATIONS', 'OWNER')")
    public PageResponse<ExpenseResponse> list(@RequestParam(required = false) Long propertyId,
                                               @RequestParam(required = false) ExpenseCategory category,
                                               Pageable pageable) {
        return expenseService.list(propertyId, category, pageable);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OPERATIONS', 'OWNER')")
    public ExpenseResponse get(@PathVariable Long id) {
        return expenseService.get(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('OPERATIONS')")
    public ExpenseResponse create(@Valid @RequestBody CreateExpenseRequest request) {
        return expenseService.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('OPERATIONS')")
    public ExpenseResponse update(@PathVariable Long id, @Valid @RequestBody UpdateExpenseRequest request) {
        return expenseService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('OPERATIONS')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        expenseService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
