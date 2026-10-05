package com.panther.pms.platform.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ClientDashboardResponse(
        String currentRoomNumber,
        String currentPropertyName,
        BigDecimal monthlyRent,
        String paymentStatus,
        LocalDate leaseExpiryDate,
        long openMaintenanceIssuesCount,
        long unreadNotificationsCount
) {
}
