package com.panther.pms.hr.dto;

import com.panther.pms.hr.entity.LeaveStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateEmployeeLeaveRequest(
        @NotNull LeaveStatus status
) {
}
