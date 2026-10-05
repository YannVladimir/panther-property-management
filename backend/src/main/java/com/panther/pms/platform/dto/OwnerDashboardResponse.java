package com.panther.pms.platform.dto;

import java.math.BigDecimal;

public record OwnerDashboardResponse(
        long totalProperties,
        double portfolioOccupancyRatePercent,
        BigDecimal monthlyRevenue,
        BigDecimal monthlyExpenses,
        BigDecimal netOperatingIncome
) {
}
