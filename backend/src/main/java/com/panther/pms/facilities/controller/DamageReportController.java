package com.panther.pms.facilities.controller;

import com.panther.pms.common.PageResponse;
import com.panther.pms.facilities.dto.CreateDamageReportRequest;
import com.panther.pms.facilities.dto.DamageReportResponse;
import com.panther.pms.facilities.dto.UpdateDamageReportRequest;
import com.panther.pms.facilities.dto.UpdateDamageStatusRequest;
import com.panther.pms.facilities.entity.DamageStatus;
import com.panther.pms.facilities.service.DamageReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PostAuthorize;
import org.springframework.security.access.prepost.PreAuthorize;
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
@RequestMapping("/api/v1/damages")
@RequiredArgsConstructor
public class DamageReportController {

    private final DamageReportService damageReportService;

    @GetMapping
    @PreAuthorize("hasRole('OPERATIONS')")
    public PageResponse<DamageReportResponse> list(@RequestParam(required = false) Long propertyId,
                                                    @RequestParam(required = false) Long clientId,
                                                    @RequestParam(required = false) DamageStatus status,
                                                    Pageable pageable) {
        return damageReportService.list(propertyId, clientId, status, pageable);
    }

    @GetMapping("/{id}")
    @PostAuthorize("hasRole('OPERATIONS') or (hasRole('CLIENT') and returnObject.clientId == principal.clientId)")
    public DamageReportResponse get(@PathVariable Long id) {
        return damageReportService.get(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('OPERATIONS')")
    public DamageReportResponse create(@Valid @RequestBody CreateDamageReportRequest request) {
        return damageReportService.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('OPERATIONS')")
    public DamageReportResponse update(@PathVariable Long id, @Valid @RequestBody UpdateDamageReportRequest request) {
        return damageReportService.update(id, request);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('OPERATIONS')")
    public DamageReportResponse updateStatus(@PathVariable Long id, @Valid @RequestBody UpdateDamageStatusRequest request) {
        return damageReportService.updateStatus(id, request);
    }
}
