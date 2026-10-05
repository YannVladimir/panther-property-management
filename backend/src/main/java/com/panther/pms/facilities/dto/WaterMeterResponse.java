package com.panther.pms.facilities.dto;

import com.panther.pms.facilities.entity.WaterPaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record WaterMeterResponse(
        Long id,
        Long propertyId,
        String propertyName,
        Long roomId,
        String roomNumber,
        Long clientId,
        String clientName,
        String meterNumber,
        BigDecimal previousReading,
        BigDecimal currentReading,
        BigDecimal consumptionM3,
        LocalDate readingDate,
        BigDecimal ratePerM3,
        BigDecimal totalAmount,
        WaterPaymentStatus paymentStatus,
        List<WaterMeterReadingResponse> history
) {
}
