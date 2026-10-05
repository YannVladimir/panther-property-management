package com.panther.pms.platform.dto;

public record OccupancyPoint(
        Long propertyId,
        String propertyName,
        int totalRooms,
        int occupiedRooms,
        double occupancyRatePercent
) {
}
