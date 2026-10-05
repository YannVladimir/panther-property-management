package com.panther.pms.hr.dto;

import com.panther.pms.hr.entity.EmployeeDocumentStatus;
import com.panther.pms.hr.entity.EmployeeDocumentType;

import java.time.LocalDate;

public record EmployeeDocumentResponse(
        Long id,
        String name,
        EmployeeDocumentType type,
        String fileUrl,
        LocalDate uploadDate,
        String sizeLabel,
        EmployeeDocumentStatus status
) {
}
