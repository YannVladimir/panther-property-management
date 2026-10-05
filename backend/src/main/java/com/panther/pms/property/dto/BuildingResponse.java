package com.panther.pms.property.dto;

public record BuildingResponse(
        Long id,
        Long propertyId,
        String propertyName,
        String name,
        int floorsCount,
        int totalRooms
) {
}
