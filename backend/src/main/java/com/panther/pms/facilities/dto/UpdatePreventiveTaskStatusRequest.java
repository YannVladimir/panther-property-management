package com.panther.pms.facilities.dto;

import com.panther.pms.facilities.entity.InspectionStatus;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record UpdatePreventiveTaskStatusRequest(
        @NotNull InspectionStatus status,
        String remarks,
        List<String> evidencePhotos
) {
}
