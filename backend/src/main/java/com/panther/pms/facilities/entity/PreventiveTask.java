package com.panther.pms.facilities.entity;

import com.panther.pms.common.BaseEntity;
import com.panther.pms.property.entity.Property;
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

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "preventive_tasks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class PreventiveTask extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PreventiveCategory category;

    @Column(name = "task_name", nullable = false)
    private String taskName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PreventiveFrequency frequency;

    @Column(name = "schedule_week", nullable = false)
    @Builder.Default
    private int scheduleWeek = 1;

    /** No FK yet — hr.Employee lands in Phase 6 (mirrors User.clientId's loose-coupling pattern). */
    @Column(name = "assigned_staff_id")
    private Long assignedStaffId;

    @Column(name = "assigned_staff_name")
    private String assignedStaffName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private InspectionStatus status = InspectionStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "last_completed_date")
    private LocalDate lastCompletedDate;

    @Column(name = "resolved_date")
    private LocalDate resolvedDate;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "preventive_task_photos", joinColumns = @JoinColumn(name = "task_id"))
    @OrderColumn(name = "sort_order")
    @Column(name = "url", columnDefinition = "TEXT")
    @Builder.Default
    private List<String> evidencePhotos = new ArrayList<>();
}
