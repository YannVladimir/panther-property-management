package com.panther.pms.facilities.dto;

import com.panther.pms.facilities.entity.WorkOrderCategory;
import com.panther.pms.facilities.entity.WorkOrderPaymentStatus;
import com.panther.pms.facilities.entity.WorkOrderPriority;
import com.panther.pms.facilities.entity.WorkOrderStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record TechWorkOrderResponse(
        Long id,
        String jobNumber,
        Long propertyId,
        String propertyName,
        Long roomId,
        String roomNumber,
        String title,
        String description,
        WorkOrderCategory category,
        WorkOrderPriority priority,
        LocalDate dispatchedDate,
        LocalDate startDate,
        LocalDate completedDate,
        BigDecimal estimatedHours,
        BigDecimal actualHours,
        BigDecimal laborCost,
        BigDecimal materialCost,
        BigDecimal totalCost,
        WorkOrderPaymentStatus paymentStatus,
        BigDecimal paidAmount,
        WorkOrderStatus status,
        Integer rating,
        String ratingComment,
        List<String> photos,
        String notes
) {
}
