package com.panther.pms.iam.dto;

public record NotificationPreferencesResponse(
        boolean emailNotifications,
        boolean smsNotifications,
        String themePreference
) {
}
