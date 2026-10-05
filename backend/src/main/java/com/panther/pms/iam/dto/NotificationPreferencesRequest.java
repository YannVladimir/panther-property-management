package com.panther.pms.iam.dto;

import jakarta.validation.constraints.NotNull;

public record NotificationPreferencesRequest(
        @NotNull Boolean emailNotifications,
        @NotNull Boolean smsNotifications,
        @NotNull String themePreference
) {
}
