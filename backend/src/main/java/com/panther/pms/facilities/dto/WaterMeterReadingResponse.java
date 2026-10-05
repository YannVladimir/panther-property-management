package com.panther.pms.facilities.dto;

import java.math.BigDecimal;

public record WaterMeterReadingResponse(
        String periodMonth,
        BigDecimal reading,
        BigDecimal consumption,
        BigDecimal amount
) {
}
