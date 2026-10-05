package com.panther.pms.finance.dto;

import com.panther.pms.finance.entity.BillPaymentMethod;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateBillPaymentRequest(
        @NotNull LocalDate paidDate,
        @NotNull @PositiveOrZero BigDecimal amount,
        @NotNull BillPaymentMethod method,
        String reference,
        String notes,
        String proofUrl
) {
}
