package com.panther.pms.hr.dto;

import com.panther.pms.hr.entity.Department;
import com.panther.pms.hr.entity.EmployeeStatus;
import com.panther.pms.hr.entity.EmploymentStatus;
import com.panther.pms.leasing.dto.EmergencyContactDto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record EmployeeResponse(
        Long id,
        String name,
        String avatarUrl,
        String position,
        Department department,
        String contact,
        String email,
        EmploymentStatus employmentStatus,
        EmployeeStatus status,
        String statusReason,
        LocalDate startDate,
        BigDecimal basicSalary,
        String nationalId,
        EmergencyContactDto emergencyContact,
        String address,
        List<EmployeeDocumentResponse> documents,
        List<EmployeeDailyTaskResponse> dailyTasks,
        List<EmployeeDamageResponse> damages,
        List<EmployeeLeaveResponse> leaves
) {
}
