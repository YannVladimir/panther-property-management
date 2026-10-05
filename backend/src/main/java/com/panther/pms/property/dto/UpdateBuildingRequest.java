package com.panther.pms.property.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record UpdateBuildingRequest(
        @NotBlank String name,
        @Min(1) int floorsCount
) {
}
