package com.panther.pms.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "panther.file-storage")
public record FileStorageProperties(
        String baseDir,
        String publicUrlPrefix
) {
}
