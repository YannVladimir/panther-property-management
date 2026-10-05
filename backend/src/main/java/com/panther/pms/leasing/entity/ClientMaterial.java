package com.panther.pms.leasing.entity;

import com.panther.pms.common.BaseEntity;
import com.panther.pms.property.entity.RentalTypeIncludedMaterial;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;

/** The actual inventory item assigned to one tenant — distinct from the rental tier's included-materials template. */
@Entity
@Table(name = "client_materials")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class ClientMaterial extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rental_type_item_id")
    private RentalTypeIncludedMaterial rentalTypeItem;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private int quantity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ClientMaterialCondition condition;

    @Column(name = "assigned_date", nullable = false)
    private LocalDate assignedDate;

    @Column(name = "serial_number")
    private String serialNumber;

    private String category;
}
