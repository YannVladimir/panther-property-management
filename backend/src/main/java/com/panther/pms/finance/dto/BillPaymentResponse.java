package com.panther.pms.finance.dto;

import com.panther.pms.finance.entity.BillPaymentMethod;

import java.math.BigDecimal;
import java.time.LocalDate;

public record BillPaymentResponse(
        Long id,
        LocalDate paidDate,
        BigDecimal amount,
        BillPaymentMethod method,
        String reference,
        String notes,
        String proofUrl
) {
}
