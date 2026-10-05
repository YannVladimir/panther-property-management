package com.panther.pms.facilities.dto;

import com.panther.pms.facilities.entity.TechDocumentStatus;
import com.panther.pms.facilities.entity.TechDocumentType;

import java.time.LocalDate;

public record TechDocumentResponse(
        Long id,
        String name,
        TechDocumentType type,
        String fileUrl,
        LocalDate uploadDate,
        LocalDate expiryDate,
        TechDocumentStatus status
) {
}
