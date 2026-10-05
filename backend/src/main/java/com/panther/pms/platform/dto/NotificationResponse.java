package com.panther.pms.platform.dto;

import com.panther.pms.platform.entity.NotificationType;

import java.time.Instant;

/** id here is the recipient row's id — what /notifications/{id}/read acts on, not the broadcast notification's id. */
public record NotificationResponse(
        Long id,
        String title,
        String message,
        NotificationType type,
        String link,
        Instant createdAt,
        boolean read
) {
}
