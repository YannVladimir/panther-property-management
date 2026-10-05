package com.panther.pms.facilities.dto;

import com.panther.pms.facilities.entity.IssueCategory;
import com.panther.pms.facilities.entity.IssuePriority;
import com.panther.pms.facilities.entity.IssueStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record MaintenanceIssueResponse(
        Long id,
        String ticketNumber,
        Long clientId,
        String clientName,
        Long propertyId,
        String propertyName,
        Long roomId,
        String roomNumber,
        IssueCategory category,
        String title,
        String description,
        IssuePriority priority,
        List<String> photos,
        IssueStatus status,
        Instant reportedDate,
        Long assignedTechnicianId,
        String assignedTechnicianName,
        String technicianSpecialty,
        LocalDate resolutionDate,
        String resolutionNotes
) {
}
