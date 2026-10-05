package com.panther.pms.facilities.dto;

import com.panther.pms.facilities.entity.TechPayoutMethod;
import com.panther.pms.facilities.entity.TechnicianAvailability;
import com.panther.pms.facilities.entity.TechnicianSpecialization;
import com.panther.pms.leasing.dto.EmergencyContactDto;

import java.math.BigDecimal;
import java.util.List;

public record TechnicianResponse(
        Long id,
        String name,
        String company,
        String contact,
        String email,
        String avatarUrl,
        TechnicianSpecialization specialization,
        BigDecimal rating,
        TechnicianAvailability availability,
        int totalJobs,
        BigDecimal totalPaid,
        BigDecimal hourlyRate,
        String notes,
        String address,
        String nationalId,
        EmergencyContactDto emergencyContact,
        TechPayoutMethod preferredPaymentMethod,
        String payoutAccount,
        List<String> certifications,
        Integer yearsExperience,
        List<TechWorkOrderResponse> workOrders,
        List<TechDocumentResponse> documents
) {
}
