package com.panther.pms.leasing.dto;

import jakarta.validation.constraints.NotNull;

public record AssignRoomRequest(
        @NotNull Long roomId
) {
}
