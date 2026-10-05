package com.panther.pms.finance.dto;

import com.panther.pms.finance.entity.BillFrequency;
import com.panther.pms.finance.entity.RecurringBillCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateRecurringBillRequest(
        @NotNull Long propertyId,
        @NotBlank String name,
        @NotNull RecurringBillCategory category,
        String vendor,
        @NotNull @PositiveOrZero BigDecimal amount,
        @NotNull BillFrequency frequency,
        @NotNull LocalDate nextDueDate,
        boolean autoRenew,
        int reminderDays
) {
}
