package com.panther.pms.property.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateBuildingRequest(
        @NotNull Long propertyId,
        @NotBlank String name,
        @Min(1) int floorsCount
) {
}
