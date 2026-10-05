package com.panther.pms.leasing.dto;

import com.panther.pms.leasing.entity.ClientMaterialCondition;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record CreateClientMaterialRequest(
        Long rentalTypeItemId,
        @NotBlank String name,
        @Positive int quantity,
        @NotNull ClientMaterialCondition condition,
        String serialNumber,
        String category
) {
}
