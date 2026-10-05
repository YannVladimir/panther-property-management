package com.panther.pms.hr.dto;

import com.panther.pms.hr.entity.Department;
import com.panther.pms.hr.entity.EmploymentStatus;
import com.panther.pms.leasing.dto.EmergencyContactDto;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.LocalDate;

public record UpdateEmployeeRequest(
        @NotBlank String name,
        @NotBlank String position,
        @NotNull Department department,
        @NotBlank String contact,
        String email,
        @NotNull EmploymentStatus employmentStatus,
        @NotNull LocalDate startDate,
        @NotNull @PositiveOrZero BigDecimal basicSalary,
        String nationalId,
        @Valid EmergencyContactDto emergencyContact,
        String address
) {
}
