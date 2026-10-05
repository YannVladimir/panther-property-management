package com.panther.pms.facilities.entity;

/** Kept domain-local even though the value set matches leasing.PayoutMethod — see BACKEND_PLAN.md section 9. */
public enum TechPayoutMethod {
    MOBILE_MONEY,
    BANK_TRANSFER,
    CASH
}
