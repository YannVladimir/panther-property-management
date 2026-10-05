package com.panther.pms.facilities.controller;

import com.panther.pms.facilities.dto.AssignWaterMeterRequest;
import com.panther.pms.facilities.dto.RecordWaterMeterPaymentRequest;
import com.panther.pms.facilities.dto.UpdateWaterMeterReadingRequest;
import com.panther.pms.facilities.dto.WaterMeterReadingResponse;
import com.panther.pms.facilities.dto.WaterMeterResponse;
import com.panther.pms.facilities.service.WaterMeterService;
import com.panther.pms.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/water-meters")
@RequiredArgsConstructor
public class WaterMeterController {

    private final WaterMeterService waterMeterService;

    @GetMapping
    @PreAuthorize("hasRole('OPERATIONS')")
    public List<WaterMeterResponse> list() {
        return waterMeterService.list();
    }

    /** "My water usage" (client portal) — kept flat here rather than /clients/me/water-meter
     *  to avoid a leasing → facilities circular package dependency, same rationale as the
     *  Phase 4 payments/payroll self-service endpoints. */
    @GetMapping("/me")
    @PreAuthorize("hasRole('CLIENT')")
    public WaterMeterResponse mine(@AuthenticationPrincipal UserPrincipal principal) {
        return waterMeterService.getByClient(principal.getClientId());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('OPERATIONS')")
    public WaterMeterResponse get(@PathVariable Long id) {
        return waterMeterService.get(id);
    }

    @GetMapping("/{id}/history")
    @PreAuthorize("hasRole('OPERATIONS')")
    public List<WaterMeterReadingResponse> history(@PathVariable Long id) {
        return waterMeterService.get(id).history();
    }

    @PostMapping
    @PreAuthorize("hasRole('OPERATIONS')")
    public WaterMeterResponse assign(@Valid @RequestBody AssignWaterMeterRequest request) {
        return waterMeterService.assign(request);
    }

    @PatchMapping("/{id}/reading")
    @PreAuthorize("hasRole('OPERATIONS')")
    public WaterMeterResponse updateReading(@PathVariable Long id, @Valid @RequestBody UpdateWaterMeterReadingRequest request) {
        return waterMeterService.updateReading(id, request);
    }

    @PostMapping("/{id}/payment")
    @PreAuthorize("hasRole('OPERATIONS')")
    public WaterMeterResponse recordPayment(@PathVariable Long id, @Valid @RequestBody RecordWaterMeterPaymentRequest request) {
        return waterMeterService.recordPayment(id, request);
    }
}
