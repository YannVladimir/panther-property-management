package com.panther.pms.facilities.controller;

import com.panther.pms.common.PageResponse;
import com.panther.pms.facilities.dto.CreateMaintenanceIssueRequest;
import com.panther.pms.facilities.dto.MaintenanceIssueResponse;
import com.panther.pms.facilities.dto.UpdateMaintenanceIssueStatusRequest;
import com.panther.pms.facilities.entity.IssueStatus;
import com.panther.pms.facilities.service.MaintenanceIssueService;
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
@RequestMapping("/api/v1/maintenance-issues")
@RequiredArgsConstructor
public class MaintenanceIssueController {

    private final MaintenanceIssueService maintenanceIssueService;

    @GetMapping
    @PreAuthorize("hasRole('OPERATIONS')")
    public PageResponse<MaintenanceIssueResponse> list(@RequestParam(required = false) IssueStatus status,
                                                        @RequestParam(required = false) Long propertyId,
                                                        @RequestParam(required = false) Long clientId,
                                                        Pageable pageable) {
        return maintenanceIssueService.list(status, propertyId, clientId, pageable);
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('CLIENT')")
    public PageResponse<MaintenanceIssueResponse> mine(@AuthenticationPrincipal UserPrincipal principal, Pageable pageable) {
        return maintenanceIssueService.listByClient(principal.getClientId(), pageable);
    }

    @PostMapping
    @PreAuthorize("hasRole('CLIENT')")
    public MaintenanceIssueResponse create(@AuthenticationPrincipal UserPrincipal principal,
                                            @Valid @RequestBody CreateMaintenanceIssueRequest request) {
        return maintenanceIssueService.create(principal.getClientId(), request);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('OPERATIONS')")
    public MaintenanceIssueResponse updateStatus(@PathVariable Long id, @Valid @RequestBody UpdateMaintenanceIssueStatusRequest request) {
        return maintenanceIssueService.updateStatus(id, request);
    }
}
