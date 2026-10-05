package com.panther.pms.facilities.controller;

import com.panther.pms.common.PageResponse;
import com.panther.pms.facilities.dto.CreatePreventiveTaskRequest;
import com.panther.pms.facilities.dto.PreventiveTaskResponse;
import com.panther.pms.facilities.dto.UpdatePreventiveTaskStatusRequest;
import com.panther.pms.facilities.entity.InspectionStatus;
import com.panther.pms.facilities.service.PreventiveTaskService;
import com.panther.pms.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/preventive-tasks")
@RequiredArgsConstructor
public class PreventiveTaskController {

    private final PreventiveTaskService preventiveTaskService;

    @GetMapping
    @PreAuthorize("hasAnyRole('OPERATIONS', 'OWNER')")
    public PageResponse<PreventiveTaskResponse> list(@RequestParam(required = false) Long propertyId,
                                                      @RequestParam(required = false) InspectionStatus status,
                                                      Pageable pageable) {
        return preventiveTaskService.list(propertyId, status, pageable);
    }

    /** "My Checklist" (HouseholdChecklistPage) — tasks assigned to the calling household staff member. */
    @GetMapping("/me")
    @PreAuthorize("hasRole('HOUSEHOLD')")
    public PageResponse<PreventiveTaskResponse> mine(@AuthenticationPrincipal UserPrincipal principal, Pageable pageable) {
        return preventiveTaskService.listByAssignedStaff(principal.getEmployeeId(), pageable);
    }

    @PostMapping
    @PreAuthorize("hasRole('OPERATIONS')")
    public PreventiveTaskResponse create(@Valid @RequestBody CreatePreventiveTaskRequest request) {
        return preventiveTaskService.create(request);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('OPERATIONS') or (hasRole('HOUSEHOLD') and @preventiveTaskAccessGuard.isAssignedTo(#id, principal.employeeId))")
    public PreventiveTaskResponse updateStatus(@PathVariable Long id, @Valid @RequestBody UpdatePreventiveTaskStatusRequest request) {
        return preventiveTaskService.updateStatus(id, request);
    }
}
