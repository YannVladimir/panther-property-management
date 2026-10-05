package com.panther.pms.platform.entity;

import com.panther.pms.common.BaseEntity;
import com.panther.pms.iam.entity.User;
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

import java.time.Instant;

/**
 * One row per (notification, user) pair — created for every user matching the notification's
 * target roles at broadcast time. This is what actually gives per-user "read" state; the
 * frontend mock only ever had one global `read: boolean`, which doesn't scale past one demo
 * user per role (see BACKEND_PLAN.md section 5.7).
 */
@Entity
@Table(name = "notification_recipients")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class NotificationRecipient extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "notification_id", nullable = false)
    private Notification notification;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "read_at")
    private Instant readAt;
}
