package com.panther.pms.leasing.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public record CreateAgentDealRequest(
        @NotBlank String clientName,
        @Email String clientEmail,
        String clientPhone,
        @NotNull Long propertyId,
        Long roomId,
        String rentalType,
        @NotNull @PositiveOrZero BigDecimal monthlyRent,
        /** Falls back to the agent's own commissionRatePercent when omitted. */
        BigDecimal commissionPercentage,
        String notes
) {
}
