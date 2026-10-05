package com.panther.pms.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "panther.seed")
public record SeedProperties(
        boolean enabled,
        String adminName,
        String adminEmail,
        String adminPassword
) {
}
