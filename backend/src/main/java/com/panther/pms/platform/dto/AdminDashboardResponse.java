package com.panther.pms.platform.dto;

import java.util.Map;

public record AdminDashboardResponse(
        long totalUsers,
        Map<String, Long> usersByRole,
        long totalProperties,
        long activityLast24h
) {
}
