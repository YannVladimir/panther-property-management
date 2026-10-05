package com.panther.pms.hr.dto;

import com.panther.pms.hr.entity.EmployeeStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateEmployeeStatusRequest(
        @NotNull EmployeeStatus status,
        String reason
) {
}
