package com.panther.pms.hr.entity;

import com.panther.pms.common.BaseEntity;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * propertyName/roomNumber are plain labels here, not FKs — the frontend's EmployeeDamage
 * type carries only strings (no propertyId), unlike EmployeeDailyTask which does have one.
 */
@Entity
@Table(name = "employee_damages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class EmployeeDamage extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "incident_date", nullable = false)
    private LocalDate incidentDate;

    @Column(nullable = false)
    private String item;

    @Column(name = "property_name")
    private String propertyName;

    @Column(name = "room_number")
    private String roomNumber;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "estimated_cost", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal estimatedCost = BigDecimal.ZERO;

    @Column(name = "deducted_from_salary", nullable = false)
    @Builder.Default
    private boolean deductedFromSalary = false;

    @Column(name = "deducted_amount", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal deductedAmount = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private EmployeeDamageStatus status = EmployeeDamageStatus.INVESTIGATING;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "employee_damage_photos", joinColumns = @JoinColumn(name = "employee_damage_id"))
    @OrderColumn(name = "sort_order")
    @Column(name = "url", columnDefinition = "TEXT")
    @Builder.Default
    private List<String> photos = new ArrayList<>();
}
