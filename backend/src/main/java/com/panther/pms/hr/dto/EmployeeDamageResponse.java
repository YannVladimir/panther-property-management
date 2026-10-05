package com.panther.pms.hr.dto;

import com.panther.pms.hr.entity.EmployeeDamageStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record EmployeeDamageResponse(
        Long id,
        LocalDate incidentDate,
        String item,
        String propertyName,
        String roomNumber,
        String description,
        BigDecimal estimatedCost,
        boolean deductedFromSalary,
        BigDecimal deductedAmount,
        EmployeeDamageStatus status,
        List<String> photos
) {
}
