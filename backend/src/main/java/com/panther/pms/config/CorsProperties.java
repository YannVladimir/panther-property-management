package com.panther.pms.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties(prefix = "panther.cors")
public record CorsProperties(
        List<String> allowedOrigins
) {
}
