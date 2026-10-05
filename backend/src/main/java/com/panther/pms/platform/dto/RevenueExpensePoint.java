package com.panther.pms.platform.dto;

import java.math.BigDecimal;

public record RevenueExpensePoint(
        String month,
        BigDecimal revenue,
        BigDecimal expenses
) {
}
