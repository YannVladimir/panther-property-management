package com.panther.pms.iam.entity;

/**
 * Mirrors the frontend's UserRole union in types/index.ts, minus 'public'
 * (an anonymous visitor is never a persisted user).
 */
public enum UserRole {
    CLIENT,
    OPERATIONS,
    OWNER,
    HOUSEHOLD,
    ADMIN
}
