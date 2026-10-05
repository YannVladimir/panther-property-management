package com.panther.pms.finance.dto;

import com.panther.pms.finance.entity.PaymentMethod;
import com.panther.pms.finance.entity.PaymentStatus;
import com.panther.pms.finance.entity.PaymentType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreatePaymentRequest(
        @NotNull Long clientId,
        @NotNull Long propertyId,
        @NotNull Long roomId,
        @NotNull @PositiveOrZero BigDecimal amount,
        @NotNull LocalDate date,
        LocalDate dueDate,
        @NotNull PaymentType type,
        @NotNull PaymentMethod method,
        String reference,
        PaymentStatus status,
        String receiptUrl,
        String notes
) {
}
