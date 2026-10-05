package com.panther.pms.leasing.dto;

import com.panther.pms.leasing.entity.BookingSource;
import com.panther.pms.leasing.entity.BookingStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record BookingResponse(
        Long id,
        String bookingNumber,
        Long clientId,
        String clientName,
        String clientEmail,
        String clientPhone,
        Long propertyId,
        String propertyName,
        Long roomId,
        String roomNumber,
        Long rentalTypeId,
        String rentalTypeName,
        Instant requestedDate,
        LocalDate moveInDate,
        LocalDate moveOutDate,
        BigDecimal monthlyRent,
        BigDecimal deposit,
        BookingStatus status,
        String notes,
        BookingSource source,
        Long agentId,
        String agentName,
        List<BookingTimelineEventResponse> timeline
) {
}
