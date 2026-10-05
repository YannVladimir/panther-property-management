package com.panther.pms.property.entity;

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
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "rooms")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Room extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "building_id")
    private Building building;

    @Column(name = "room_number", nullable = false, length = 20)
    private String roomNumber;

    @Column(nullable = false)
    @Builder.Default
    private int floor = 1;

    @Column(name = "size_sq_m", precision = 8, scale = 2)
    private BigDecimal sizeSqM;

    @Column(nullable = false)
    @Builder.Default
    private int bedrooms = 1;

    @Column(nullable = false)
    @Builder.Default
    private int bathrooms = 1;

    @Enumerated(EnumType.STRING)
    @Column(name = "furnishing_type", nullable = false, length = 30)
    private FurnishingType furnishingType;

    @Column(name = "monthly_rent", nullable = false, precision = 10, scale = 2)
    private BigDecimal monthlyRent;

    @Column(nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal deposit = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private RoomStatus status = RoomStatus.AVAILABLE;

    /** Set once the leasing domain exists (Phase 3) — kept as a plain id for now, like User.clientId. */
    @Column(name = "current_client_id")
    private Long currentClientId;

    @Column(name = "virtual_tour_url", columnDefinition = "TEXT")
    private String virtualTourUrl;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "room_images", joinColumns = @JoinColumn(name = "room_id"))
    @OrderColumn(name = "sort_order")
    @Column(name = "url", columnDefinition = "TEXT")
    @Builder.Default
    private List<String> images = new ArrayList<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "room_amenities", joinColumns = @JoinColumn(name = "room_id"))
    @OrderColumn(name = "sort_order")
    @Column(name = "amenity")
    @Builder.Default
    private List<String> amenities = new ArrayList<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "room_utilities_included", joinColumns = @JoinColumn(name = "room_id"))
    @OrderColumn(name = "sort_order")
    @Column(name = "utility")
    @Builder.Default
    private List<String> utilitiesIncluded = new ArrayList<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "room_rules", joinColumns = @JoinColumn(name = "room_id"))
    @OrderColumn(name = "sort_order")
    @Column(name = "rule", columnDefinition = "TEXT")
    @Builder.Default
    private List<String> rules = new ArrayList<>();
}
