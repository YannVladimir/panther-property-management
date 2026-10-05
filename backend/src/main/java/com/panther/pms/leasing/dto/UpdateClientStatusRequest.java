package com.panther.pms.leasing.dto;

import com.panther.pms.leasing.entity.ClientStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateClientStatusRequest(
        @NotNull ClientStatus status,
        String reason
) {
}
