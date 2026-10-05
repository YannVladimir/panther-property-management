package com.panther.pms.facilities.dto;

import com.panther.pms.facilities.entity.WorkOrderPaymentStatus;
import com.panther.pms.facilities.entity.WorkOrderPriority;
import com.panther.pms.facilities.entity.WorkOrderStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record UpdateTechWorkOrderRequest(
        WorkOrderPriority priority,
        LocalDate startDate,
        LocalDate completedDate,
        BigDecimal actualHours,
        @NotNull @PositiveOrZero BigDecimal laborCost,
        @NotNull @PositiveOrZero BigDecimal materialCost,
        @NotNull WorkOrderPaymentStatus paymentStatus,
        @PositiveOrZero BigDecimal paidAmount,
        @NotNull WorkOrderStatus status,
        @Min(1) @Max(5) Integer rating,
        String ratingComment,
        List<String> photos,
        String notes
) {
}
