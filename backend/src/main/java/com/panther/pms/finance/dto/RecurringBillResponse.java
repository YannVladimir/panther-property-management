package com.panther.pms.finance.dto;

import com.panther.pms.finance.entity.BillFrequency;
import com.panther.pms.finance.entity.RecurringBillCategory;
import com.panther.pms.finance.entity.RecurringBillStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record RecurringBillResponse(
        Long id,
        Long propertyId,
        String propertyName,
        String name,
        RecurringBillCategory category,
        String vendor,
        BigDecimal amount,
        BillFrequency frequency,
        LocalDate nextDueDate,
        RecurringBillStatus status,
        boolean autoRenew,
        int reminderDays,
        List<BillPaymentResponse> payments
) {
}
