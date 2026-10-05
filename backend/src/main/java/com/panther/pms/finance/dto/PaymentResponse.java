package com.panther.pms.finance.dto;

import com.panther.pms.finance.entity.PaymentMethod;
import com.panther.pms.finance.entity.PaymentStatus;
import com.panther.pms.finance.entity.PaymentType;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PaymentResponse(
        Long id,
        String invoiceNumber,
        Long clientId,
        String clientName,
        Long propertyId,
        String propertyName,
        Long roomId,
        String roomNumber,
        BigDecimal amount,
        LocalDate date,
        LocalDate dueDate,
        PaymentType type,
        PaymentMethod method,
        String reference,
        PaymentStatus status,
        String receiptUrl,
        String notes
) {
}
