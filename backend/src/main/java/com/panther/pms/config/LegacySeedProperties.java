package com.panther.pms.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "panther.legacy-seed")
public record LegacySeedProperties(
        boolean enabled
) {
}
