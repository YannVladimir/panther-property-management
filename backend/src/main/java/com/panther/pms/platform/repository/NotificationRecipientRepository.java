package com.panther.pms.platform.repository;

import com.panther.pms.platform.entity.NotificationRecipient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;

public interface NotificationRecipientRepository extends JpaRepository<NotificationRecipient, Long> {

    Page<NotificationRecipient> findByUserIdOrderByIdDesc(Long userId, Pageable pageable);

    Optional<NotificationRecipient> findByIdAndUserId(Long id, Long userId);

    long countByUserIdAndReadAtIsNull(Long userId);

    @Modifying
    @Query("update NotificationRecipient r set r.readAt = :now where r.user.id = :userId and r.readAt is null")
    int markAllRead(@Param("userId") Long userId, @Param("now") Instant now);
}
