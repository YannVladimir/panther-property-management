package com.panther.pms.facilities.entity;

import com.panther.pms.common.BaseEntity;
import com.panther.pms.property.entity.Property;
import com.panther.pms.property.entity.Room;
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

@Entity
@Table(name = "tech_work_orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class TechWorkOrder extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "technician_id", nullable = false)
    private Technician technician;

    @Column(name = "job_number", nullable = false, unique = true, length = 30)
    private String jobNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    private Room room;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private WorkOrderCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private WorkOrderPriority priority = WorkOrderPriority.MEDIUM;

    @Column(name = "dispatched_date", nullable = false)
    private LocalDate dispatchedDate;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "completed_date")
    private LocalDate completedDate;

    @Column(name = "estimated_hours", precision = 6, scale = 2)
    private BigDecimal estimatedHours;

    @Column(name = "actual_hours", precision = 6, scale = 2)
    private BigDecimal actualHours;

    @Column(name = "labor_cost", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal laborCost = BigDecimal.ZERO;

    @Column(name = "material_cost", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal materialCost = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false, length = 20)
    @Builder.Default
    private WorkOrderPaymentStatus paymentStatus = WorkOrderPaymentStatus.UNPAID;

    @Column(name = "paid_amount", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private WorkOrderStatus status = WorkOrderStatus.DISPATCHED;

    private Integer rating;

    @Column(name = "rating_comment", columnDefinition = "TEXT")
    private String ratingComment;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "tech_work_order_photos", joinColumns = @JoinColumn(name = "work_order_id"))
    @OrderColumn(name = "sort_order")
    @Column(name = "url", columnDefinition = "TEXT")
    @Builder.Default
    private List<String> photos = new ArrayList<>();

    /** Derived, not stored — see TechWorkOrder#getTotalCost(). */
    public BigDecimal getTotalCost() {
        return laborCost.add(materialCost);
    }
}
