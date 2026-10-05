package com.panther.pms.facilities.entity;

import com.panther.pms.common.BaseEntity;
import com.panther.pms.common.EmergencyContact;
import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
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
@Table(name = "technicians")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Technician extends BaseEntity {

    @Column(nullable = false)
    private String name;

    private String company;

    @Column(nullable = false)
    private String contact;

    private String email;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TechnicianSpecialization specialization;

    @Column(nullable = false, precision = 3, scale = 2)
    @Builder.Default
    private BigDecimal rating = BigDecimal.valueOf(5.0);

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private TechnicianAvailability availability = TechnicianAvailability.AVAILABLE;

    @Column(name = "hourly_rate", precision = 8, scale = 2)
    private BigDecimal hourlyRate;

    @Column(columnDefinition = "TEXT")
    private String notes;

    private String address;

    @Column(name = "national_id")
    private String nationalId;

    @Embedded
    private EmergencyContact emergencyContact;

    @Enumerated(EnumType.STRING)
    @Column(name = "preferred_payment_method", length = 20)
    private TechPayoutMethod preferredPaymentMethod;

    @Column(name = "payout_account")
    private String payoutAccount;

    @Column(name = "years_experience")
    private Integer yearsExperience;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "technician_certifications", joinColumns = @JoinColumn(name = "technician_id"))
    @OrderColumn(name = "sort_order")
    @Column(name = "certification")
    @Builder.Default
    private List<String> certifications = new ArrayList<>();

    @OneToMany(mappedBy = "technician", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("id DESC")
    @Builder.Default
    private List<TechWorkOrder> workOrders = new ArrayList<>();

    @OneToMany(mappedBy = "technician", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("id DESC")
    @Builder.Default
    private List<TechDocument> documents = new ArrayList<>();
}
