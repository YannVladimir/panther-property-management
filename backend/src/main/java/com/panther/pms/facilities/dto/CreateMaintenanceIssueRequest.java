package com.panther.pms.facilities.dto;

import com.panther.pms.facilities.entity.IssueCategory;
import com.panther.pms.facilities.entity.IssuePriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record CreateMaintenanceIssueRequest(
        @NotNull Long propertyId,
        @NotNull Long roomId,
        @NotNull IssueCategory category,
        @NotBlank String title,
        String description,
        IssuePriority priority,
        List<String> photos
) {
}
