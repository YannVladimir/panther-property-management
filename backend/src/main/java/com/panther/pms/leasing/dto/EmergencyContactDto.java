package com.panther.pms.leasing.dto;

/**
 * Optional in practice — the `emergency_contact_*` columns on Client are nullable (a client
 * created via booking check-in, for instance, never captures one), so this must not force it.
 */
public record EmergencyContactDto(
        String name,
        String phone,
        String relationship
) {
}
