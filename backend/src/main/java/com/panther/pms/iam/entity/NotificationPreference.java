package com.panther.pms.iam.entity;

import com.panther.pms.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "notification_preferences")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class NotificationPreference extends BaseEntity {

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(name = "email_notifications", nullable = false)
    @Builder.Default
    private boolean emailNotifications = true;

    @Column(name = "sms_notifications", nullable = false)
    @Builder.Default
    private boolean smsNotifications = true;

    @Column(name = "theme_preference", nullable = false, length = 10)
    @Builder.Default
    private String themePreference = "system";
}
