package com.panther.pms.property.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public record IncludedMaterialItemRequest(
        @NotBlank String name,
        @Positive int quantity,
        @NotBlank String condition,
        String category
) {
}
