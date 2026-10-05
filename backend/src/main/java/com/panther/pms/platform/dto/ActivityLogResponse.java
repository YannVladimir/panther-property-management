package com.panther.pms.platform.dto;

import com.panther.pms.common.audit.ActivityType;

import java.time.Instant;

public record ActivityLogResponse(
        Long id,
        Instant occurredAt,
        Long userId,
        String userName,
        String role,
        String action,
        String module,
        String details,
        ActivityType type
) {
}
