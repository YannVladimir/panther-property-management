package com.panther.pms.facilities.dto;

import com.panther.pms.facilities.entity.TechPayoutMethod;
import com.panther.pms.facilities.entity.TechnicianSpecialization;
import com.panther.pms.leasing.dto.EmergencyContactDto;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

public record CreateTechnicianRequest(
        @NotBlank String name,
        String company,
        @NotBlank String contact,
        String email,
        @NotNull TechnicianSpecialization specialization,
        BigDecimal hourlyRate,
        String notes,
        String address,
        String nationalId,
        @Valid EmergencyContactDto emergencyContact,
        TechPayoutMethod preferredPaymentMethod,
        String payoutAccount,
        List<String> certifications,
        Integer yearsExperience
) {
}
