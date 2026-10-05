package com.panther.pms.leasing.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.util.List;

public record PayAgentCommissionRequest(
        @NotNull @Positive BigDecimal amount,
        @NotBlank String paymentMethod,
        @NotBlank String reference,
        /** When empty, marks all of the agent's currently-unpaid deals as settled. */
        List<Long> dealIds
) {
}
