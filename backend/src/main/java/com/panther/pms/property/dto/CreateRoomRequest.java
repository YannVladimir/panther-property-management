package com.panther.pms.property.dto;

import com.panther.pms.property.entity.FurnishingType;
import com.panther.pms.property.entity.RoomStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.util.List;

public record CreateRoomRequest(
        @NotNull Long propertyId,
        Long buildingId,
        @NotBlank String roomNumber,
        int floor,
        BigDecimal sizeSqM,
        int bedrooms,
        int bathrooms,
        @NotNull FurnishingType furnishingType,
        @NotNull @PositiveOrZero BigDecimal monthlyRent,
        @PositiveOrZero BigDecimal deposit,
        RoomStatus status,
        List<String> amenities,
        List<String> utilitiesIncluded,
        List<String> rules,
        List<String> images,
        String virtualTourUrl,
        String description
) {
}
