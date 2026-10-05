package com.panther.pms.leasing.dto;

import com.panther.pms.leasing.entity.AgentDealStatus;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AgentDealResponse(
        Long id,
        String clientName,
        String clientEmail,
        String clientPhone,
        Long propertyId,
        String propertyName,
        Long roomId,
        String roomNumber,
        String rentalType,
        BigDecimal monthlyRent,
        BigDecimal commissionPercentage,
        BigDecimal commissionAmount,
        LocalDate dealDate,
        AgentDealStatus status,
        LocalDate payoutDate,
        String payoutReference,
        String notes
) {
}
