package com.panther.pms.hr.dto;

import com.panther.pms.hr.entity.DailyTaskStatus;
import com.panther.pms.hr.entity.TaskPriority;

import java.time.LocalDate;

public record EmployeeDailyTaskResponse(
        Long id,
        String title,
        String description,
        LocalDate assignedDate,
        LocalDate dueDate,
        TaskPriority priority,
        Long propertyId,
        String propertyName,
        String roomNumber,
        DailyTaskStatus status,
        LocalDate completedDate,
        String managerComment,
        Integer rating,
        String ratedByName
) {
}
