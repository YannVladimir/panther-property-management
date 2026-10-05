package com.panther.pms.iam.controller;

import com.panther.pms.common.PageResponse;
import com.panther.pms.iam.dto.CreateUserRequest;
import com.panther.pms.iam.dto.NotificationPreferencesRequest;
import com.panther.pms.iam.dto.NotificationPreferencesResponse;
import com.panther.pms.iam.dto.UpdateUserRequest;
import com.panther.pms.iam.dto.UpdateUserStatusRequest;
import com.panther.pms.iam.dto.UserResponse;
import com.panther.pms.iam.entity.UserRole;
import com.panther.pms.iam.entity.UserStatus;
import com.panther.pms.iam.service.NotificationPreferenceService;
import com.panther.pms.iam.service.UserService;
import com.panther.pms.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final NotificationPreferenceService notificationPreferenceService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public PageResponse<UserResponse> list(@RequestParam(required = false) UserRole role,
                                            @RequestParam(required = false) UserStatus status,
                                            @RequestParam(required = false) String search,
                                            Pageable pageable) {
        return userService.list(role, status, search, pageable);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> create(@Valid @RequestBody CreateUserRequest request) {
        return ResponseEntity.ok(userService.create(request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse get(@PathVariable Long id) {
        return userService.get(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse update(@PathVariable Long id, @Valid @RequestBody UpdateUserRequest request) {
        return userService.update(id, request);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse updateStatus(@PathVariable Long id, @Valid @RequestBody UpdateUserStatusRequest request) {
        return userService.updateStatus(id, request.status());
    }

    @PostMapping("/{id}/reset-password")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> resetPassword(@PathVariable Long id) {
        userService.triggerPasswordReset(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/resend-invite")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> resendInvite(@PathVariable Long id) {
        userService.resendInvite(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me/preferences")
    public NotificationPreferencesResponse getMyPreferences(@AuthenticationPrincipal UserPrincipal principal) {
        return notificationPreferenceService.get(principal.getId());
    }

    @PatchMapping("/me/preferences")
    public NotificationPreferencesResponse updateMyPreferences(@AuthenticationPrincipal UserPrincipal principal,
                                                                 @Valid @RequestBody NotificationPreferencesRequest request) {
        return notificationPreferenceService.update(principal.getId(), request);
    }
}
