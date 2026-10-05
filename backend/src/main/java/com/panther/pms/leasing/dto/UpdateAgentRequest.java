package com.panther.pms.leasing.dto;

import com.panther.pms.leasing.entity.AgentStatus;
import com.panther.pms.leasing.entity.PayoutMethod;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record UpdateAgentRequest(
        @NotBlank String name,
        String agency,
        @NotBlank String phone,
        @NotBlank @Email String email,
        @NotNull BigDecimal commissionRatePercent,
        @NotNull AgentStatus status,
        PayoutMethod paymentMethod,
        String payoutAccount,
        String notes
) {
}
