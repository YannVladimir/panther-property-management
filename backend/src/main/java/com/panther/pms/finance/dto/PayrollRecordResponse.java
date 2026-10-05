package com.panther.pms.finance.dto;

import com.panther.pms.finance.entity.PaymentMethod;
import com.panther.pms.finance.entity.PayrollPaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PayrollRecordResponse(
        Long id,
        String payrollNumber,
        Long employeeId,
        String employeeName,
        String position,
        String department,
        String period,
        BigDecimal basicSalary,
        BigDecimal allowances,
        BigDecimal bonuses,
        BigDecimal deductions,
        BigDecimal taxAmount,
        BigDecimal netSalary,
        LocalDate paymentDate,
        PayrollPaymentStatus paymentStatus,
        PaymentMethod paymentMethod
) {
}
