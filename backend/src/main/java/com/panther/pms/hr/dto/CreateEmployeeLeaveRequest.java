package com.panther.pms.hr.dto;

import com.panther.pms.hr.entity.LeaveStatus;
import com.panther.pms.hr.entity.LeaveType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record CreateEmployeeLeaveRequest(
        @NotNull LeaveType leaveType,
        @NotNull java.time.LocalDate startDate,
        @NotNull java.time.LocalDate endDate,
        @Positive int daysCount,
        String reason,
        /** Defaults to PENDING when omitted — e.g. a household self-service request. */
        LeaveStatus status
) {
}
