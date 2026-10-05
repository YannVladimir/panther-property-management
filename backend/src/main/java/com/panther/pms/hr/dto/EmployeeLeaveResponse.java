package com.panther.pms.hr.dto;

import com.panther.pms.hr.entity.LeaveStatus;
import com.panther.pms.hr.entity.LeaveType;

import java.time.LocalDate;

public record EmployeeLeaveResponse(
        Long id,
        LeaveType leaveType,
        LocalDate startDate,
        LocalDate endDate,
        int daysCount,
        String reason,
        LeaveStatus status,
        String approvedByName,
        LocalDate requestedDate
) {
}
