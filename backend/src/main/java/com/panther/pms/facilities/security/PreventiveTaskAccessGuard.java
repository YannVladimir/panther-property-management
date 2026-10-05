package com.panther.pms.facilities.security;

import com.panther.pms.facilities.repository.PreventiveTaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Backs the @PreAuthorize check on PATCH /preventive-tasks/{id}/status. This must run
 * BEFORE the mutation (unlike @PostAuthorize, which only blocks the *response* after the
 * write already happened) since household staff may only update tasks assigned to them.
 */
@Component("preventiveTaskAccessGuard")
@RequiredArgsConstructor
public class PreventiveTaskAccessGuard {

    private final PreventiveTaskRepository preventiveTaskRepository;

    public boolean isAssignedTo(Long taskId, Long employeeId) {
        if (employeeId == null) {
            return false;
        }
        return preventiveTaskRepository.findById(taskId)
                .map(t -> employeeId.equals(t.getAssignedStaffId()))
                .orElse(false);
    }
}
