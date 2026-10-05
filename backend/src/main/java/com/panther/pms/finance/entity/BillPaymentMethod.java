package com.panther.pms.finance.entity;

/** Distinct from finance.PaymentMethod — the frontend's BillPayment union swaps CREDIT_CARD for CHEQUE. */
public enum BillPaymentMethod {
    MOBILE_MONEY,
    BANK_TRANSFER,
    CASH,
    CHEQUE
}
