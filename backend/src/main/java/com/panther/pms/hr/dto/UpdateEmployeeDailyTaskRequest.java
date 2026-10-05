package com.panther.pms.hr.dto;

import com.panther.pms.hr.entity.DailyTaskStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

/** All fields optional — a true partial update, mirroring the frontend's Partial&lt;EmployeeDailyTask&gt;. */
public record UpdateEmployeeDailyTaskRequest(
        DailyTaskStatus status,
        String managerComment,
        @Min(1) @Max(5) Integer rating
) {
}
