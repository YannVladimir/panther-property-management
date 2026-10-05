package com.panther.pms.hr.dto;

import com.panther.pms.hr.entity.EmployeeDocumentStatus;
import com.panther.pms.hr.entity.EmployeeDocumentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateEmployeeDocumentRequest(
        @NotBlank String name,
        @NotNull EmployeeDocumentType type,
        @NotBlank String fileUrl,
        String sizeLabel,
        EmployeeDocumentStatus status
) {
}
