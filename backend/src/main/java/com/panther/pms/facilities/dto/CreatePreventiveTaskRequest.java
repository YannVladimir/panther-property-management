package com.panther.pms.facilities.dto;

import com.panther.pms.facilities.entity.PreventiveCategory;
import com.panther.pms.facilities.entity.PreventiveFrequency;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record CreatePreventiveTaskRequest(
        @NotNull Long propertyId,
        @NotNull PreventiveCategory category,
        @NotBlank String taskName,
        @NotNull PreventiveFrequency frequency,
        @Min(1) @Max(4) int scheduleWeek,
        Long assignedStaffId,
        String assignedStaffName,
        @NotNull LocalDate dueDate
) {
}
