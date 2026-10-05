package com.panther.pms.common.storage;

public record StoredFile(
        String url,
        String originalFilename,
        String contentType,
        String sizeLabel
) {
}
