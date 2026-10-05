package com.panther.pms.platform.dto;

public record HouseholdDashboardResponse(
        long todaysTasksCount,
        long completedThisWeekCount,
        Double averageRating
) {
}
