package com.panther.pms.iam.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record UpdateSystemSettingsRequest(
        @NotBlank String companyName,
        @NotBlank String currencyCode,
        @NotNull BigDecimal waterRatePerM3,
        @NotNull BigDecimal defaultAgentCommissionPct,
        @NotNull BigDecimal vatTaxRatePct
) {
}
