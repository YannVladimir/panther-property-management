package com.panther.pms.property.entity;

import com.panther.pms.common.BaseEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "rental_types")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class RentalType extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true, length = 30)
    private FurnishingType name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "price_multiplier", nullable = false, precision = 5, scale = 3)
    @Builder.Default
    private BigDecimal priceMultiplier = BigDecimal.ONE;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private RentalTypeStatus status = RentalTypeStatus.ACTIVE;

    @OneToMany(mappedBy = "rentalType", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("id ASC")
    @Builder.Default
    private List<RentalTypeIncludedMaterial> includedMaterials = new ArrayList<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "rental_type_applicable_properties",
            joinColumns = @JoinColumn(name = "rental_type_id"),
            inverseJoinColumns = @JoinColumn(name = "property_id")
    )
    @Builder.Default
    private Set<Property> applicableProperties = new HashSet<>();
}
