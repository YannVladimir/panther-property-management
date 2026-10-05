package com.panther.pms.iam.dto;

import java.math.BigDecimal;

public record SystemSettingsResponse(
        String companyName,
        String currencyCode,
        BigDecimal waterRatePerM3,
        BigDecimal defaultAgentCommissionPct,
        BigDecimal vatTaxRatePct
) {
}
