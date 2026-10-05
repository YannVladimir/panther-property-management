package com.panther.pms.leasing.entity;

import com.panther.pms.common.BaseEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
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
import java.util.List;

/**
 * clientsReferred / bookingsCount / successfulRentals / totalCommissionEarned /
 * commissionPaid / outstandingCommission are all computed at read time from
 * bookings/agent_deals (see AgentService) rather than stored counters — avoids the
 * drift risk of the frontend mock's manual increment-on-write approach (see
 * BACKEND_PLAN.md section 9, decision 7).
 */
@Entity
@Table(name = "agents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Agent extends BaseEntity {

    /** Set once this broker also has a portal login. Loose coupling, like User.clientId (Phase 1). */
    @Column(name = "user_id")
    private Long userId;

    @Column(nullable = false)
    private String name;

    private String agency;

    @Column(nullable = false)
    private String phone;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private AgentStatus status = AgentStatus.ACTIVE;

    @Column(name = "commission_rate_pct", nullable = false, precision = 5, scale = 2)
    private BigDecimal commissionRatePercent;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", length = 20)
    private PayoutMethod paymentMethod;

    @Column(name = "payout_account")
    private String payoutAccount;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @OneToMany(mappedBy = "agent", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("id DESC")
    @Builder.Default
    private List<AgentDeal> deals = new ArrayList<>();
}
