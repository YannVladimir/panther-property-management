package com.panther.pms.leasing.dto;

import com.panther.pms.leasing.entity.AgentStatus;
import com.panther.pms.leasing.entity.PayoutMethod;

import java.math.BigDecimal;
import java.util.List;

public record AgentResponse(
        Long id,
        String name,
        String agency,
        String phone,
        String email,
        String avatarUrl,
        AgentStatus status,
        int clientsReferred,
        int bookingsCount,
        int successfulRentals,
        BigDecimal commissionRatePercent,
        BigDecimal totalCommissionEarned,
        BigDecimal commissionPaid,
        BigDecimal outstandingCommission,
        PayoutMethod paymentMethod,
        String payoutAccount,
        String notes,
        List<AgentDealResponse> deals
) {
}
