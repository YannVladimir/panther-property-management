package com.panther.pms.common;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Shared value object — Client, Employee, and Technician all carry an identical
 * emergency-contact shape in the frontend's types (name/phone/relationship).
 */
@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EmergencyContact {

    @Column(name = "emergency_contact_name")
    private String name;

    @Column(name = "emergency_contact_phone")
    private String phone;

    @Column(name = "emergency_contact_relationship")
    private String relationship;
}
