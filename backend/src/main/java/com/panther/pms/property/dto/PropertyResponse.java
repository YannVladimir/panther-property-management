package com.panther.pms.property.dto;

import com.panther.pms.property.entity.PropertyStatus;

import java.math.BigDecimal;
import java.util.List;

public record PropertyResponse(
        Long id,
        String name,
        String code,
        String location,
        String neighborhood,
        String city,
        String address,
        List<String> images,
        List<String> amenities,
        String description,
        BigDecimal rating,
        int reviewCount,
        boolean featured,
        Integer yearBuilt,
        BigDecimal monthlyRevenueEstimate,
        PropertyStatus status,
        int totalRooms,
        int occupiedRooms,
        int availableRooms,
        int reservedRooms,
        int maintenanceRooms
) {
}
