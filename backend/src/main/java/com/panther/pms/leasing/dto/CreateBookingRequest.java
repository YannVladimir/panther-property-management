package com.panther.pms.leasing.dto;

import com.panther.pms.leasing.entity.BookingSource;
import com.panther.pms.leasing.entity.BookingStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateBookingRequest(
        Long clientId,
        @NotBlank String clientName,
        @Email String clientEmail,
        String clientPhone,
        @NotNull Long propertyId,
        Long roomId,
        @NotNull Long rentalTypeId,
        @NotNull LocalDate moveInDate,
        LocalDate moveOutDate,
        @NotNull @PositiveOrZero BigDecimal monthlyRent,
        @PositiveOrZero BigDecimal deposit,
        String notes,
        BookingSource source,
        Long agentId,
        BookingStatus status
) {
}
