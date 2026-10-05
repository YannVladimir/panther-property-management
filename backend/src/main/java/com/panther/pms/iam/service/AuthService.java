package com.panther.pms.iam.service;

import com.panther.pms.common.exception.UnauthorizedException;
import com.panther.pms.iam.dto.AuthResponse;
import com.panther.pms.iam.dto.LoginRequest;
import com.panther.pms.iam.entity.User;
import com.panther.pms.iam.entity.UserStatus;
import com.panther.pms.iam.mapper.UserMapper;
import com.panther.pms.iam.repository.UserRepository;
import com.panther.pms.security.JwtService;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UserMapper userMapper;
    private final EmailService emailService;

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password."));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password.");
        }
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new UnauthorizedException("This account is " + user.getStatus().name().toLowerCase() + ".");
        }

        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        return buildAuthResponse(user);
    }

    public AuthResponse refresh(String refreshToken) {
        Claims claims = jwtService.parseClaims(refreshToken);
        jwtService.requireType(claims, jwtService.refreshTokenType());

        User user = userRepository.findById(jwtService.requireUserId(claims))
                .orElseThrow(() -> new UnauthorizedException("User no longer exists."));
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new UnauthorizedException("This account is " + user.getStatus().name().toLowerCase() + ".");
        }

        return buildAuthResponse(user);
    }

    @Transactional
    public void changePassword(Long userId, String currentPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("User no longer exists."));

        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new UnauthorizedException("Current password is incorrect.");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setMustChangePassword(false);
        userRepository.save(user);
    }

    public void forgotPassword(String email) {
        userRepository.findByEmailIgnoreCase(email).ifPresent(user -> {
            String resetToken = jwtService.generatePasswordResetToken(user);
            emailService.sendPasswordReset(user, resetToken);
        });
        // Deliberately no error when the email doesn't exist — avoids leaking account existence.
    }

    @Transactional
    public void resetPassword(String resetToken, String newPassword) {
        Claims claims = jwtService.parseClaims(resetToken);
        jwtService.requireType(claims, jwtService.passwordResetTokenType());

        User user = userRepository.findById(jwtService.requireUserId(claims))
                .orElseThrow(() -> new UnauthorizedException("User no longer exists."));

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setMustChangePassword(false);
        userRepository.save(user);
    }

    private AuthResponse buildAuthResponse(User user) {
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);
        return new AuthResponse(accessToken, refreshToken, userMapper.toResponse(user));
    }
}
