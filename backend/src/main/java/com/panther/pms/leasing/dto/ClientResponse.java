package com.panther.pms.leasing.dto;

import com.panther.pms.leasing.entity.ClientPaymentStatus;
import com.panther.pms.leasing.entity.ClientStatus;
import com.panther.pms.property.entity.FurnishingType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record ClientResponse(
        Long id,
        Long userId,
        String name,
        String email,
        String phone,
        String avatarUrl,
        String identificationNumber,
        String nationality,
        String occupation,
        String employer,
        EmergencyContactDto emergencyContact,
        Long currentRoomId,
        String currentRoomNumber,
        Long currentPropertyId,
        String currentPropertyName,
        FurnishingType rentalType,
        LocalDate moveInDate,
        LocalDate leaseExpiryDate,
        BigDecimal monthlyRent,
        BigDecimal depositPaid,
        ClientPaymentStatus paymentStatus,
        ClientStatus status,
        String deactivationReason,
        LocalDate deactivatedDate,
        String notes,
        List<ClientMaterialResponse> materials,
        List<ClientDocumentResponse> documents
) {
}
