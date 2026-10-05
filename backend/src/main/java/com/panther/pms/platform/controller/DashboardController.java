package com.panther.pms.platform.controller;

import com.panther.pms.platform.dto.AdminDashboardResponse;
import com.panther.pms.platform.dto.ClientDashboardResponse;
import com.panther.pms.platform.dto.HouseholdDashboardResponse;
import com.panther.pms.platform.dto.OperationsDashboardResponse;
import com.panther.pms.platform.dto.OwnerDashboardResponse;
import com.panther.pms.platform.service.DashboardService;
import com.panther.pms.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/operations")
    @PreAuthorize("hasRole('OPERATIONS')")
    public OperationsDashboardResponse operations() {
        return dashboardService.operations();
    }

    @GetMapping("/owner")
    @PreAuthorize("hasRole('OWNER')")
    public OwnerDashboardResponse owner() {
        return dashboardService.owner();
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public AdminDashboardResponse admin() {
        return dashboardService.admin();
    }

    @GetMapping("/client")
    @PreAuthorize("hasRole('CLIENT')")
    public ClientDashboardResponse client(@AuthenticationPrincipal UserPrincipal principal) {
        return dashboardService.client(principal.getId(), principal.getClientId());
    }

    @GetMapping("/household")
    @PreAuthorize("hasRole('HOUSEHOLD')")
    public HouseholdDashboardResponse household(@AuthenticationPrincipal UserPrincipal principal) {
        return dashboardService.household(principal.getEmployeeId());
    }
}
