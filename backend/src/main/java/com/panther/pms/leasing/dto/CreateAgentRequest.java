package com.panther.pms.leasing.dto;

import com.panther.pms.leasing.entity.PayoutMethod;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;

public record CreateAgentRequest(
        @NotBlank String name,
        String agency,
        @NotBlank String phone,
        @NotBlank @Email String email,
        BigDecimal commissionRatePercent,
        PayoutMethod paymentMethod,
        String payoutAccount,
        String notes
) {
}
