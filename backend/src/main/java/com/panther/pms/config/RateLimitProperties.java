package com.panther.pms.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "panther.security.rate-limit")
public record RateLimitProperties(
        boolean enabled,
        int loginLimit,
        int loginWindowSeconds,
        int bookingLimit,
        int bookingWindowSeconds
) {
}
