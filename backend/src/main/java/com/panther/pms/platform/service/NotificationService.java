package com.panther.pms.platform.service;

import com.panther.pms.common.PageResponse;
import com.panther.pms.common.exception.ResourceNotFoundException;
import com.panther.pms.iam.entity.User;
import com.panther.pms.iam.entity.UserRole;
import com.panther.pms.iam.repository.UserRepository;
import com.panther.pms.platform.dto.CreateNotificationRequest;
import com.panther.pms.platform.dto.NotificationResponse;
import com.panther.pms.platform.entity.Notification;
import com.panther.pms.platform.entity.NotificationRecipient;
import com.panther.pms.platform.repository.NotificationRecipientRepository;
import com.panther.pms.platform.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationRecipientRepository notificationRecipientRepository;
    private final UserRepository userRepository;

    public PageResponse<NotificationResponse> listMine(Long userId, Pageable pageable) {
        return PageResponse.of(notificationRecipientRepository.findByUserIdOrderByIdDesc(userId, pageable)
                .map(this::toResponse));
    }

    @Transactional
    public Notification broadcast(CreateNotificationRequest request) {
        Set<UserRole> roles = new HashSet<>(request.targetRoles());

        Notification notification = Notification.builder()
                .title(request.title())
                .message(request.message())
                .type(request.type())
                .link(request.link())
                .targetRoles(roles)
                .build();
        notification = notificationRepository.save(notification);

        List<User> recipients = userRepository.findAll().stream()
                .filter(u -> roles.contains(u.getRole()))
                .toList();
        for (User user : recipients) {
            notification.getRecipients().add(NotificationRecipient.builder()
                    .notification(notification)
                    .user(user)
                    .build());
        }
        notificationRepository.flush();

        return notification;
    }

    @Transactional
    public void markRead(Long recipientId, Long userId) {
        NotificationRecipient recipient = notificationRecipientRepository.findByIdAndUserId(recipientId, userId)
                .orElseThrow(() -> ResourceNotFoundException.of("Notification", recipientId));
        if (recipient.getReadAt() == null) {
            recipient.setReadAt(Instant.now());
            notificationRecipientRepository.save(recipient);
        }
    }

    @Transactional
    public void markAllRead(Long userId) {
        notificationRecipientRepository.markAllRead(userId, Instant.now());
    }

    private NotificationResponse toResponse(NotificationRecipient r) {
        Notification n = r.getNotification();
        return new NotificationResponse(r.getId(), n.getTitle(), n.getMessage(), n.getType(), n.getLink(),
                n.getCreatedAt(), r.getReadAt() != null);
    }
}
