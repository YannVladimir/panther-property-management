package com.panther.pms.platform.dto;

import java.math.BigDecimal;

public record PropertyPerformancePoint(
        Long propertyId,
        String propertyName,
        BigDecimal monthlyRevenue,
        double occupancyRatePercent
) {
}
