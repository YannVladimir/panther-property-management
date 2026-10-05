package com.panther.pms.iam.controller;

import com.panther.pms.iam.dto.SystemSettingsResponse;
import com.panther.pms.iam.dto.UpdateSystemSettingsRequest;
import com.panther.pms.iam.service.SystemSettingsService;
import com.panther.pms.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/settings")
@RequiredArgsConstructor
public class SettingsController {

    private final SystemSettingsService systemSettingsService;

    @GetMapping
    @PreAuthorize("hasAnyRole('OPERATIONS', 'OWNER', 'ADMIN')")
    public SystemSettingsResponse get() {
        return systemSettingsService.get();
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public SystemSettingsResponse update(@AuthenticationPrincipal UserPrincipal principal,
                                          @Valid @RequestBody UpdateSystemSettingsRequest request) {
        return systemSettingsService.update(request, principal.getId());
    }
}
