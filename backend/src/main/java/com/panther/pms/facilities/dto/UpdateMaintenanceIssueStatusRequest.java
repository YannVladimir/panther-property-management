package com.panther.pms.facilities.dto;

import com.panther.pms.facilities.entity.IssueStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateMaintenanceIssueStatusRequest(
        @NotNull IssueStatus status,
        Long assignedTechnicianId,
        String notes
) {
}
