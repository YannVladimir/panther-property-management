package com.panther.pms.facilities.dto;

import com.panther.pms.finance.entity.PaymentMethod;
import jakarta.validation.constraints.NotNull;

public record RecordWaterMeterPaymentRequest(
        @NotNull PaymentMethod paymentMethod,
        String reference
) {
}
