package com.panther.pms.iam.dto;

import com.panther.pms.iam.entity.UserRole;
import com.panther.pms.iam.entity.UserStatus;

import java.time.Instant;

public record UserResponse(
        Long id,
        String name,
        String email,
        String phone,
        UserRole role,
        String avatarUrl,
        String title,
        Long clientId,
        Long employeeId,
        UserStatus status,
        Instant lastLoginAt,
        boolean mustChangePassword,
        Instant createdAt
) {
}
