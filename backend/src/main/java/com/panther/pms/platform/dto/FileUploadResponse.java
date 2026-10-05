package com.panther.pms.platform.dto;

public record FileUploadResponse(
        String url,
        String originalFilename,
        String contentType,
        String sizeLabel
) {
}
