package com.panther.pms.facilities.entity;

import com.panther.pms.common.BaseEntity;
import com.panther.pms.leasing.entity.Client;
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
@Table(name = "damage_reports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class DamageReport extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    private Client client;

    @Column(nullable = false)
    private String item;

    @Column(name = "damage_type")
    private String damageType;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "reported_date", nullable = false)
    private LocalDate reportedDate;

    @Column(name = "estimated_cost", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal estimatedCost = BigDecimal.ZERO;

    @Column(name = "amount_charged", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal amountCharged = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "responsible_party", nullable = false, length = 20)
    private ResponsibleParty responsibleParty;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private DamageStatus status = DamageStatus.PENDING_REVIEW;

    @Column(name = "resolution_notes", columnDefinition = "TEXT")
    private String resolutionNotes;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "damage_report_photos", joinColumns = @JoinColumn(name = "damage_report_id"))
    @OrderColumn(name = "sort_order")
    @Column(name = "url", columnDefinition = "TEXT")
    @Builder.Default
    private List<String> photos = new ArrayList<>();
}
