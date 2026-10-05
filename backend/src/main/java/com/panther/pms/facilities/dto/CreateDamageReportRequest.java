package com.panther.pms.facilities.dto;

import com.panther.pms.facilities.entity.ResponsibleParty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record CreateDamageReportRequest(
        @NotNull Long propertyId,
        @NotNull Long roomId,
        Long clientId,
        @NotBlank String item,
        String damageType,
        String description,
        @NotNull LocalDate reportedDate,
        List<String> photos,
        @PositiveOrZero BigDecimal estimatedCost,
        @PositiveOrZero BigDecimal amountCharged,
        @NotNull ResponsibleParty responsibleParty
) {
}
