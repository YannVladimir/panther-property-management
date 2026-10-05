package com.panther.pms.iam.controller;

import com.panther.pms.iam.dto.AuthResponse;
import com.panther.pms.iam.dto.ChangePasswordRequest;
import com.panther.pms.iam.dto.ForgotPasswordRequest;
import com.panther.pms.iam.dto.LoginRequest;
import com.panther.pms.iam.dto.RefreshRequest;
import com.panther.pms.iam.dto.ResetPasswordRequest;
import com.panther.pms.iam.dto.UserResponse;
import com.panther.pms.iam.mapper.UserMapper;
import com.panther.pms.iam.repository.UserRepository;
import com.panther.pms.iam.service.AuthService;
import com.panther.pms.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final UserMapper userMapper;

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(@Valid @RequestBody RefreshRequest request) {
        return authService.refresh(request.refreshToken());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        // Stateless JWT: nothing to invalidate server-side yet. A refresh-token
        // denylist/store is a natural Phase 8 hardening addition (see BACKEND_PLAN.md).
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal UserPrincipal principal) {
        return userMapper.toResponse(userRepository.findById(principal.getId()).orElseThrow());
    }

    @PostMapping("/change-password")
    public ResponseEntity<Void> changePassword(@AuthenticationPrincipal UserPrincipal principal,
                                                @Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(principal.getId(), request.currentPassword(), request.newPassword());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request.email());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.resetToken(), request.newPassword());
        return ResponseEntity.noContent().build();
    }
}
