package com.panther.pms.finance.dto;

import com.panther.pms.finance.entity.PaymentMethod;
import com.panther.pms.finance.entity.PayrollPaymentStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreatePayrollRecordRequest(
        @NotNull Long employeeId,
        @NotBlank String employeeName,
        String position,
        String department,
        @NotBlank String period,
        @NotNull @PositiveOrZero BigDecimal basicSalary,
        BigDecimal allowances,
        BigDecimal bonuses,
        BigDecimal deductions,
        BigDecimal taxAmount,
        LocalDate paymentDate,
        @NotNull PayrollPaymentStatus paymentStatus,
        @NotNull PaymentMethod paymentMethod
) {
}
