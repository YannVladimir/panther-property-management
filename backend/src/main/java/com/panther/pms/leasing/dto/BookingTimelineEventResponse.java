package com.panther.pms.leasing.dto;

import com.panther.pms.leasing.entity.BookingStatus;

import java.time.Instant;

public record BookingTimelineEventResponse(
        BookingStatus status,
        Instant occurredAt,
        String note,
        String updatedByName
) {
}
