package com.panther.pms.hr.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record CreateEmployeeDamageRequest(
        @NotNull LocalDate incidentDate,
        @NotBlank String item,
        String propertyName,
        String roomNumber,
        String description,
        @PositiveOrZero BigDecimal estimatedCost,
        boolean deductedFromSalary,
        @PositiveOrZero BigDecimal deductedAmount,
        List<String> photos
) {
}
