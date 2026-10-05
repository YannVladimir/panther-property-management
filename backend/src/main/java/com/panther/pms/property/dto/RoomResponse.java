package com.panther.pms.property.dto;

import com.panther.pms.property.entity.FurnishingType;
import com.panther.pms.property.entity.RoomStatus;

import java.math.BigDecimal;
import java.util.List;

public record RoomResponse(
        Long id,
        Long propertyId,
        String propertyName,
        Long buildingId,
        String buildingName,
        String roomNumber,
        int floor,
        BigDecimal sizeSqM,
        int bedrooms,
        int bathrooms,
        FurnishingType furnishingType,
        BigDecimal monthlyRent,
        BigDecimal deposit,
        RoomStatus status,
        List<String> amenities,
        List<String> utilitiesIncluded,
        List<String> rules,
        List<String> images,
        Long currentClientId,
        String virtualTourUrl,
        String description
) {
}
