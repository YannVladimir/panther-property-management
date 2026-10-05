package com.panther.pms.leasing.entity;

import com.panther.pms.common.BaseEntity;
import com.panther.pms.common.EmergencyContact;
import com.panther.pms.property.entity.FurnishingType;
import com.panther.pms.property.entity.Property;
import com.panther.pms.property.entity.Room;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
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
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "clients")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Client extends BaseEntity {

    /** Set once this resident also has a portal login. Loose coupling, like User.clientId (Phase 1). */
    @Column(name = "user_id")
    private Long userId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String phone;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(name = "identification_number", unique = true)
    private String identificationNumber;

    private String nationality;

    private String occupation;

    private String employer;

    @Embedded
    private EmergencyContact emergencyContact;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "current_room_id")
    private Room currentRoom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "current_property_id")
    private Property currentProperty;

    @Enumerated(EnumType.STRING)
    @Column(name = "rental_type", length = 30)
    private FurnishingType rentalType;

    @Column(name = "move_in_date")
    private LocalDate moveInDate;

    @Column(name = "lease_expiry_date")
    private LocalDate leaseExpiryDate;

    @Column(name = "monthly_rent", precision = 10, scale = 2)
    private BigDecimal monthlyRent;

    @Column(name = "deposit_paid", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal depositPaid = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false, length = 20)
    @Builder.Default
    private ClientPaymentStatus paymentStatus = ClientPaymentStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ClientStatus status = ClientStatus.ACTIVE;

    @Column(name = "deactivation_reason", columnDefinition = "TEXT")
    private String deactivationReason;

    @Column(name = "deactivated_date")
    private LocalDate deactivatedDate;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @OneToMany(mappedBy = "client", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("id DESC")
    @Builder.Default
    private List<ClientMaterial> materials = new ArrayList<>();

    @OneToMany(mappedBy = "client", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("id DESC")
    @Builder.Default
    private List<ClientDocument> documents = new ArrayList<>();
}
