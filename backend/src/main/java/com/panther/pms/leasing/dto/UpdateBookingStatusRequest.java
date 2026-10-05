package com.panther.pms.leasing.dto;

import com.panther.pms.leasing.entity.BookingStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateBookingStatusRequest(
        @NotNull BookingStatus status,
        String note
) {
}
