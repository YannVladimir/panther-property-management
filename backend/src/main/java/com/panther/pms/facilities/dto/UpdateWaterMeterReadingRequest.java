package com.panther.pms.facilities.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public record UpdateWaterMeterReadingRequest(
        @NotNull @PositiveOrZero BigDecimal currentReading,
        boolean newBillingCycle
) {
}
