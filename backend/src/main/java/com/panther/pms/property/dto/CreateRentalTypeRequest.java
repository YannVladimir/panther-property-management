package com.panther.pms.property.dto;

import com.panther.pms.property.entity.FurnishingType;
import com.panther.pms.property.entity.RentalTypeStatus;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

public record CreateRentalTypeRequest(
        @NotNull FurnishingType name,
        String description,
        @NotNull BigDecimal priceMultiplier,
        List<IncludedMaterialItemRequest> includedMaterials,
        @NotNull RentalTypeStatus status,
        List<Long> applicablePropertyIds
) {
}
