package com.panther.pms.facilities.dto;

import com.panther.pms.facilities.entity.TechDocumentStatus;
import com.panther.pms.facilities.entity.TechDocumentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record CreateTechDocumentRequest(
        @NotBlank String name,
        @NotNull TechDocumentType type,
        @NotBlank String fileUrl,
        LocalDate expiryDate,
        TechDocumentStatus status
) {
}
