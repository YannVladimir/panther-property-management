package com.panther.pms.leasing.dto;

import com.panther.pms.leasing.entity.ClientDocumentStatus;
import com.panther.pms.leasing.entity.ClientDocumentType;

import java.time.LocalDate;

public record ClientDocumentResponse(
        Long id,
        String name,
        ClientDocumentType type,
        String fileUrl,
        LocalDate uploadDate,
        String sizeLabel,
        ClientDocumentStatus status
) {
}
