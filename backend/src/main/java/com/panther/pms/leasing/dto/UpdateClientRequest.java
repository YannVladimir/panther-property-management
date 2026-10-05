package com.panther.pms.leasing.dto;

import com.panther.pms.property.entity.FurnishingType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;
import java.time.LocalDate;

public record UpdateClientRequest(
        @NotBlank String name,
        @NotBlank @Email String email,
        @NotBlank String phone,
        String avatarUrl,
        String identificationNumber,
        String nationality,
        String occupation,
        String employer,
        @Valid EmergencyContactDto emergencyContact,
        Long currentRoomId,
        Long currentPropertyId,
        FurnishingType rentalType,
        LocalDate moveInDate,
        LocalDate leaseExpiryDate,
        BigDecimal monthlyRent,
        BigDecimal depositPaid,
        String notes
) {
}
