package com.panther.pms.finance.dto;

import com.panther.pms.finance.entity.ExpenseCategory;
import com.panther.pms.finance.entity.ExpenseStatus;
import com.panther.pms.finance.entity.PaymentMethod;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.LocalDate;

public record UpdateExpenseRequest(
        @NotNull ExpenseCategory category,
        @NotBlank String description,
        @NotNull @PositiveOrZero BigDecimal amount,
        @NotNull LocalDate date,
        String vendor,
        @NotNull PaymentMethod paymentMethod,
        @NotNull ExpenseStatus status,
        boolean receiptAttached,
        String notes
) {
}
