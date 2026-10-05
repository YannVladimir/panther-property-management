package com.panther.pms.hr.dto;

import com.panther.pms.hr.entity.TaskPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record CreateEmployeeDailyTaskRequest(
        @NotBlank String title,
        String description,
        @NotNull LocalDate dueDate,
        TaskPriority priority,
        Long propertyId,
        String roomNumber
) {
}
