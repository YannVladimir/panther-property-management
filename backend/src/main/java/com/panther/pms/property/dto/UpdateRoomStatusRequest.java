package com.panther.pms.property.dto;

import com.panther.pms.property.entity.RoomStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateRoomStatusRequest(
        @NotNull RoomStatus status
) {
}
