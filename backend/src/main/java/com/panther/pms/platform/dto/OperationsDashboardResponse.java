package com.panther.pms.platform.dto;

import java.math.BigDecimal;

public record OperationsDashboardResponse(
        long pendingBookings,
        double occupancyRatePercent,
        BigDecimal monthlyRevenue,
        long overdueBillsCount,
        long openMaintenanceIssuesCount
) {
}
