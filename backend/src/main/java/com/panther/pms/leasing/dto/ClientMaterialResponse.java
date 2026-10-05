package com.panther.pms.leasing.dto;

import com.panther.pms.leasing.entity.ClientMaterialCondition;

import java.time.LocalDate;

public record ClientMaterialResponse(
        Long id,
        Long rentalTypeItemId,
        String name,
        int quantity,
        ClientMaterialCondition condition,
        LocalDate assignedDate,
        String serialNumber,
        String category
) {
}
