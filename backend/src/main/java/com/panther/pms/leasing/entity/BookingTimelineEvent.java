package com.panther.pms.leasing.entity;

import com.panther.pms.common.BaseEntity;
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

import java.time.Instant;

@Entity
@Table(name = "booking_timeline_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class BookingTimelineEvent extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BookingStatus status;

    @Column(name = "occurred_at", nullable = false)
    private Instant occurredAt;

    @Column(columnDefinition = "TEXT")
    private String note;

    /**
     * Display name of whoever made the change (matches the frontend's plain-string
     * `updatedBy` field exactly — not a hard FK to users, since a public/anonymous
     * booking inquiry has no user id to reference).
     */
    @Column(name = "updated_by_name", nullable = false)
    private String updatedByName;
}
