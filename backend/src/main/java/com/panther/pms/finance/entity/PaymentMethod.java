package com.panther.pms.finance.entity;

/** Broader than leasing.PayoutMethod (adds CREDIT_CARD) — kept domain-local per BACKEND_PLAN.md section 9. */
public enum PaymentMethod {
    MOBILE_MONEY,
    BANK_TRANSFER,
    CREDIT_CARD,
    CASH
}
