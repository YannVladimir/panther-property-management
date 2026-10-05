package com.panther.pms.iam.dto;

import com.panther.pms.iam.entity.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UpdateUserRequest(
        @NotBlank String name,
        @NotBlank @Email String email,
        String phone,
        @NotNull UserRole role,
        String title,
        Long clientId,
        Long employeeId
) {
}
