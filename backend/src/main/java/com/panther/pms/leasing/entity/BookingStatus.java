package com.panther.pms.leasing.entity;

/** Mirrors the frontend's BookingStatus union in types/index.ts. */
public enum BookingStatus {
    REQUESTED,
    UNDER_REVIEW,
    APPROVED,
    ROOM_ASSIGNED,
    CONFIRMED,
    CHECKED_IN,
    CANCELLED,
    REJECTED,
    COMPLETED
}
