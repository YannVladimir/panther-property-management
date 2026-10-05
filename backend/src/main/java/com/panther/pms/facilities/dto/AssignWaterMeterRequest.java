package com.panther.pms.facilities.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public record AssignWaterMeterRequest(
        @NotNull Long clientId,
        @NotBlank String meterNumber,
        @PositiveOrZero BigDecimal initialReading,
        /** Falls back to system_settings.waterRatePerM3 when omitted. */
        BigDecimal ratePerM3
) {
}
