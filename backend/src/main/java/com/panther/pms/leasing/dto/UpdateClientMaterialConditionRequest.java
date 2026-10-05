package com.panther.pms.leasing.dto;

import com.panther.pms.leasing.entity.ClientMaterialCondition;
import jakarta.validation.constraints.NotNull;

public record UpdateClientMaterialConditionRequest(
        @NotNull ClientMaterialCondition condition
) {
}
