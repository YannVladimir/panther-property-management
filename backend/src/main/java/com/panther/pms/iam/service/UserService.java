package com.panther.pms.iam.service;

import com.panther.pms.common.PageResponse;
import com.panther.pms.common.audit.ActivityType;
import com.panther.pms.common.audit.AuditService;
import com.panther.pms.common.exception.ConflictException;
import com.panther.pms.common.exception.ResourceNotFoundException;
import com.panther.pms.iam.dto.CreateUserRequest;
import com.panther.pms.iam.dto.UpdateUserRequest;
import com.panther.pms.iam.dto.UserResponse;
import com.panther.pms.iam.entity.User;
import com.panther.pms.iam.entity.UserRole;
import com.panther.pms.iam.entity.UserStatus;
import com.panther.pms.iam.mapper.UserMapper;
import com.panther.pms.iam.repository.UserRepository;
import com.panther.pms.iam.repository.UserSpecifications;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;
    private final EmailService emailService;
    private final AuthService authService;
    private final AuditService auditService;

    public PageResponse<UserResponse> list(UserRole role, UserStatus status, String search, Pageable pageable) {
        var page = userRepository.findAll(UserSpecifications.filter(role, status, search), pageable)
                .map(userMapper::toResponse);
        return PageResponse.of(page);
    }

    public UserResponse get(Long id) {
        return userMapper.toResponse(findOrThrow(id));
    }

    @Transactional
    public UserResponse create(CreateUserRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new ConflictException("A user with this email already exists.");
        }

        String temporaryPassword = PasswordGenerator.generate(12);
        User user = User.builder()
                .name(request.name())
                .email(request.email())
                .phone(request.phone())
                .role(request.role())
                .title(request.title())
                .clientId(request.clientId())
                .employeeId(request.employeeId())
                .passwordHash(passwordEncoder.encode(temporaryPassword))
                .status(UserStatus.ACTIVE)
                .mustChangePassword(true)
                .build();

        user = userRepository.save(user);
        emailService.sendInvite(user, temporaryPassword);
        auditService.log("User Created", "Users", "Created account for " + user.getName() + " (" + user.getRole() + ")", ActivityType.SUCCESS);
        return userMapper.toResponse(user);
    }

    @Transactional
    public UserResponse update(Long id, UpdateUserRequest request) {
        User user = findOrThrow(id);

        if (!user.getEmail().equalsIgnoreCase(request.email())
                && userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new ConflictException("A user with this email already exists.");
        }

        user.setName(request.name());
        user.setEmail(request.email());
        user.setPhone(request.phone());
        user.setRole(request.role());
        user.setTitle(request.title());
        user.setClientId(request.clientId());
        user.setEmployeeId(request.employeeId());

        user = userRepository.save(user);
        auditService.log("User Updated", "Users", "Updated profile for " + user.getName(), ActivityType.INFO);
        return userMapper.toResponse(user);
    }

    @Transactional
    public UserResponse updateStatus(Long id, UserStatus status) {
        User user = findOrThrow(id);
        user.setStatus(status);
        user = userRepository.save(user);
        auditService.log("User Status Changed", "Users", user.getName() + " status set to " + status, ActivityType.WARNING);
        return userMapper.toResponse(user);
    }

    public void triggerPasswordReset(Long id) {
        User user = findOrThrow(id);
        authService.forgotPassword(user.getEmail());
    }

    @Transactional
    public void resendInvite(Long id) {
        User user = findOrThrow(id);
        String temporaryPassword = PasswordGenerator.generate(12);
        user.setPasswordHash(passwordEncoder.encode(temporaryPassword));
        user.setMustChangePassword(true);
        userRepository.save(user);
        emailService.sendInvite(user, temporaryPassword);
    }

    @Transactional
    public void delete(Long id) {
        if (!userRepository.existsById(id)) {
            throw ResourceNotFoundException.of("User", id);
        }
        userRepository.deleteById(id);
    }

    private User findOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("User", id));
    }
}
