package com.panther.pms.property.dto;

import com.panther.pms.property.entity.FurnishingType;
import com.panther.pms.property.entity.RentalTypeStatus;

import java.math.BigDecimal;
import java.util.List;

public record RentalTypeResponse(
        Long id,
        FurnishingType name,
        String description,
        BigDecimal priceMultiplier,
        List<IncludedMaterialItemResponse> includedMaterials,
        RentalTypeStatus status,
        List<Long> applicablePropertyIds
) {
}
