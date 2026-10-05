package com.panther.pms.facilities.dto;

import com.panther.pms.facilities.entity.DamageStatus;
import com.panther.pms.facilities.entity.ResponsibleParty;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record DamageReportResponse(
        Long id,
        Long propertyId,
        String propertyName,
        Long roomId,
        String roomNumber,
        Long clientId,
        String clientName,
        String item,
        String damageType,
        String description,
        LocalDate reportedDate,
        List<String> photos,
        BigDecimal estimatedCost,
        BigDecimal amountCharged,
        ResponsibleParty responsibleParty,
        DamageStatus status,
        String resolutionNotes
) {
}
