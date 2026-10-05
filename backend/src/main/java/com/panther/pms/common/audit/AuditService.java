package com.panther.pms.common.audit;

import com.panther.pms.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Called directly from mutating service methods across every domain — replaces the manual
 * addActivityLog(...) calls sprinkled through the frontend mock's DataContext.tsx with one
 * shared entry point. Resolves the acting user from the security context itself (not a method
 * parameter), so calling services don't need their method signatures touched just to plumb an
 * actor through. Lives in `common` rather than `platform` specifically so every domain can
 * depend on it without creating a circular package dependency (platform.NotificationService
 * depends on iam.User for its broadcast fan-out, so platform can't be something iam depends on)
 * — see BACKEND_PLAN.md section 10, Phase 7, for exactly which mutations call this.
 */
@Service
@RequiredArgsConstructor
public class AuditService {

    private final ActivityLogRepository activityLogRepository;

    /** REQUIRES_NEW so a log write never gets rolled back by the business transaction it's auditing failing later, and vice versa. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String action, String module, String details, ActivityType type) {
        Long userId = null;
        String userName = "Public";
        String role = "PUBLIC";

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
            userId = principal.getId();
            userName = principal.getName();
            role = principal.getRole().name();
        }

        activityLogRepository.save(ActivityLog.builder()
                .occurredAt(Instant.now())
                .userId(userId)
                .userName(userName)
                .role(role)
                .action(action)
                .module(module)
                .details(details)
                .type(type)
                .build());
    }
}
