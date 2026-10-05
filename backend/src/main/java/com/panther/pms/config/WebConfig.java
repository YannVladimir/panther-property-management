package com.panther.pms.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;

@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

    private final FileStorageProperties fileStorageProperties;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path baseDir = Path.of(fileStorageProperties.baseDir()).toAbsolutePath().normalize();
        registry.addResourceHandler(fileStorageProperties.publicUrlPrefix() + "/**")
                .addResourceLocations("file:" + baseDir + "/");
    }
}
