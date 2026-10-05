package com.panther.pms.finance.dto;

import com.panther.pms.finance.entity.ExpenseCategory;
import com.panther.pms.finance.entity.ExpenseStatus;
import com.panther.pms.finance.entity.PaymentMethod;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ExpenseResponse(
        Long id,
        Long propertyId,
        String propertyName,
        ExpenseCategory category,
        String description,
        BigDecimal amount,
        LocalDate date,
        String vendor,
        PaymentMethod paymentMethod,
        ExpenseStatus status,
        boolean receiptAttached,
        String notes
) {
}
