package com.panther.pms.iam.dto;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        UserResponse user
) {
}
