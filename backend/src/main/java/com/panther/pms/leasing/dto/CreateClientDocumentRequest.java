package com.panther.pms.leasing.dto;

import com.panther.pms.leasing.entity.ClientDocumentStatus;
import com.panther.pms.leasing.entity.ClientDocumentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateClientDocumentRequest(
        @NotBlank String name,
        @NotNull ClientDocumentType type,
        @NotBlank String fileUrl,
        String sizeLabel,
        ClientDocumentStatus status
) {
}
