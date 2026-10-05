package com.panther.pms.platform.dto;

import com.panther.pms.iam.entity.UserRole;
import com.panther.pms.platform.entity.NotificationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record CreateNotificationRequest(
        @NotBlank String title,
        @NotBlank String message,
        @NotNull NotificationType type,
        String link,
        @NotEmpty List<UserRole> targetRoles
) {
}
