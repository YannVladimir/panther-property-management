package com.panther.pms.facilities.dto;

import com.panther.pms.facilities.entity.DamageStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateDamageStatusRequest(
        @NotNull DamageStatus status,
        String resolutionNotes
) {
}
