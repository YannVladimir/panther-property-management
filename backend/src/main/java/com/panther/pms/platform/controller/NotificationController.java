package com.panther.pms.platform.controller;

import com.panther.pms.common.PageResponse;
import com.panther.pms.platform.dto.CreateNotificationRequest;
import com.panther.pms.platform.dto.NotificationResponse;
import com.panther.pms.platform.service.NotificationService;
import com.panther.pms.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/me")
    public PageResponse<NotificationResponse> mine(@AuthenticationPrincipal UserPrincipal principal, Pageable pageable) {
        return notificationService.listMine(principal.getId(), pageable);
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markRead(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id) {
        notificationService.markRead(id, principal.getId());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllRead(@AuthenticationPrincipal UserPrincipal principal) {
        notificationService.markAllRead(principal.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OPERATIONS', 'ADMIN')")
    public ResponseEntity<Void> broadcast(@Valid @RequestBody CreateNotificationRequest request) {
        notificationService.broadcast(request);
        return ResponseEntity.noContent().build();
    }
}
