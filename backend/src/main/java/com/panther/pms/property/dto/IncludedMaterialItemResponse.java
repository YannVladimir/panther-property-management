package com.panther.pms.property.dto;

public record IncludedMaterialItemResponse(
        Long id,
        String name,
        int quantity,
        String condition,
        String category
) {
}
