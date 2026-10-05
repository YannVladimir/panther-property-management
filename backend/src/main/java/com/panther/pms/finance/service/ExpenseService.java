package com.panther.pms.finance.service;

import com.panther.pms.common.PageResponse;
import com.panther.pms.common.audit.ActivityType;
import com.panther.pms.common.audit.AuditService;
import com.panther.pms.common.exception.ResourceNotFoundException;
import com.panther.pms.finance.dto.CreateExpenseRequest;
import com.panther.pms.finance.dto.ExpenseResponse;
import com.panther.pms.finance.dto.UpdateExpenseRequest;
import com.panther.pms.finance.entity.Expense;
import com.panther.pms.finance.entity.ExpenseCategory;
import com.panther.pms.finance.repository.ExpenseRepository;
import com.panther.pms.finance.repository.ExpenseSpecifications;
import com.panther.pms.property.entity.Property;
import com.panther.pms.property.repository.PropertyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final PropertyRepository propertyRepository;
    private final AuditService auditService;

    public PageResponse<ExpenseResponse> list(Long propertyId, ExpenseCategory category, Pageable pageable) {
        var page = expenseRepository.findAll(ExpenseSpecifications.filter(propertyId, category), pageable)
                .map(this::toResponse);
        return PageResponse.of(page);
    }

    public ExpenseResponse get(Long id) {
        return toResponse(findOrThrow(id));
    }

    @Transactional
    public ExpenseResponse create(CreateExpenseRequest request) {
        Property property = propertyRepository.findById(request.propertyId())
                .orElseThrow(() -> ResourceNotFoundException.of("Property", request.propertyId()));

        Expense expense = Expense.builder()
                .property(property)
                .category(request.category())
                .description(request.description())
                .amount(request.amount())
                .date(request.date())
                .vendor(request.vendor())
                .paymentMethod(request.paymentMethod())
                .receiptAttached(request.receiptAttached())
                .notes(request.notes())
                .build();
        if (request.status() != null) {
            expense.setStatus(request.status());
        }

        expense = expenseRepository.save(expense);
        auditService.log("Expense Added", "Expenses", "Logged $" + expense.getAmount() + " for " + expense.getCategory()
                + " (" + expense.getVendor() + ")", ActivityType.INFO);
        return toResponse(expense);
    }

    @Transactional
    public ExpenseResponse update(Long id, UpdateExpenseRequest request) {
        Expense expense = findOrThrow(id);
        expense.setCategory(request.category());
        expense.setDescription(request.description());
        expense.setAmount(request.amount());
        expense.setDate(request.date());
        expense.setVendor(request.vendor());
        expense.setPaymentMethod(request.paymentMethod());
        expense.setStatus(request.status());
        expense.setReceiptAttached(request.receiptAttached());
        expense.setNotes(request.notes());
        return toResponse(expenseRepository.save(expense));
    }

    @Transactional
    public void delete(Long id) {
        expenseRepository.delete(findOrThrow(id));
    }

    private ExpenseResponse toResponse(Expense e) {
        return new ExpenseResponse(e.getId(), e.getProperty().getId(), e.getProperty().getName(), e.getCategory(),
                e.getDescription(), e.getAmount(), e.getDate(), e.getVendor(), e.getPaymentMethod(), e.getStatus(),
                e.isReceiptAttached(), e.getNotes());
    }

    private Expense findOrThrow(Long id) {
        return expenseRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Expense", id));
    }
}
