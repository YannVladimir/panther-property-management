package com.panther.pms.facilities.dto;

import com.panther.pms.facilities.entity.WorkOrderCategory;
import com.panther.pms.facilities.entity.WorkOrderPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record CreateTechWorkOrderRequest(
        @NotNull Long propertyId,
        Long roomId,
        @NotBlank String title,
        String description,
        @NotNull WorkOrderCategory category,
        WorkOrderPriority priority,
        @NotNull LocalDate dispatchedDate,
        BigDecimal estimatedHours,
        List<String> photos,
        String notes
) {
}
