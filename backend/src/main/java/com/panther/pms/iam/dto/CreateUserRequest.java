package com.panther.pms.iam.dto;

import com.panther.pms.iam.entity.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateUserRequest(
        @NotBlank String name,
        @NotBlank @Email String email,
        String phone,
        @NotNull UserRole role,
        String title,
        /** Links a CLIENT-role account to its leasing.Client record (Phase 3). */
        Long clientId,
        /** Links a HOUSEHOLD/OPERATIONS-role account to its hr.Employee record (Phase 6). */
        Long employeeId
) {
}
