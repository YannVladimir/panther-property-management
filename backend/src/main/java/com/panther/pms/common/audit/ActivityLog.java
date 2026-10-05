package com.panther.pms.common.audit;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * Append-only audit trail — no BaseEntity (no updatedAt; a log entry is never mutated after
 * being written). Lives in `common` (not `platform`) specifically so every domain's services
 * can call AuditService without creating a circular package dependency — see BACKEND_PLAN.md
 * section 10, Phase 7.
 */
@Entity
@Table(name = "activity_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "occurred_at", nullable = false)
    private Instant occurredAt;

    /** Nullable — some actions happen with no authenticated principal (public booking inquiry). */
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "user_name", nullable = false)
    private String userName;

    @Column(nullable = false, length = 20)
    private String role;

    @Column(nullable = false)
    private String action;

    @Column(nullable = false)
    private String module;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String details;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ActivityType type;
}
