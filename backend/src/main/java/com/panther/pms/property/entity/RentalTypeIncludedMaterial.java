package com.panther.pms.property.entity;

import com.panther.pms.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

/**
 * The included-materials *template* attached to a rental tier (e.g. "Fully Furnished
 * includes: sofa x1, fridge x1, TV x1"). Distinct from leasing.ClientMaterial, which is
 * the actual inventory assigned to one tenant (Phase 3).
 */
@Entity
@Table(name = "rental_type_included_materials")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class RentalTypeIncludedMaterial extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "rental_type_id", nullable = false)
    private RentalType rentalType;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private int quantity;

    @Column(nullable = false, length = 50)
    private String condition;

    private String category;
}
