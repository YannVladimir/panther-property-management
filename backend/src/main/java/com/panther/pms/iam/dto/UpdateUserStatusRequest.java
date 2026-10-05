package com.panther.pms.iam.dto;

import com.panther.pms.iam.entity.UserStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateUserStatusRequest(
        @NotNull UserStatus status
) {
}
