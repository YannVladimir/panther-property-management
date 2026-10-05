package com.panther.pms.platform.repository;

import com.panther.pms.platform.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
}
