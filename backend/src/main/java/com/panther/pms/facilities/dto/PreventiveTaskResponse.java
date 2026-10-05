package com.panther.pms.facilities.dto;

import com.panther.pms.facilities.entity.InspectionStatus;
import com.panther.pms.facilities.entity.PreventiveCategory;
import com.panther.pms.facilities.entity.PreventiveFrequency;

import java.time.LocalDate;
import java.util.List;

public record PreventiveTaskResponse(
        Long id,
        Long propertyId,
        String propertyName,
        PreventiveCategory category,
        String taskName,
        PreventiveFrequency frequency,
        int scheduleWeek,
        Long assignedStaffId,
        String assignedStaffName,
        InspectionStatus status,
        String remarks,
        List<String> evidencePhotos,
        LocalDate lastCompletedDate,
        LocalDate dueDate,
        LocalDate resolvedDate
) {
}
