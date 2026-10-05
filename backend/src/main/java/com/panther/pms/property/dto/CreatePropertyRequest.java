package com.panther.pms.property.dto;

import com.panther.pms.property.entity.PropertyStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

public record CreatePropertyRequest(
        @NotBlank String name,
        @NotBlank String location,
        String neighborhood,
        String city,
        String address,
        List<String> images,
        List<String> amenities,
        String description,
        BigDecimal rating,
        Integer yearBuilt,
        BigDecimal monthlyRevenueEstimate,
        boolean featured,
        @NotNull PropertyStatus status
) {
}
