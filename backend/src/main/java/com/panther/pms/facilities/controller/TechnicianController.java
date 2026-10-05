package com.panther.pms.facilities.controller;

import com.panther.pms.common.PageResponse;
import com.panther.pms.facilities.dto.CreateTechDocumentRequest;
import com.panther.pms.facilities.dto.CreateTechWorkOrderRequest;
import com.panther.pms.facilities.dto.CreateTechnicianRequest;
import com.panther.pms.facilities.dto.TechDocumentResponse;
import com.panther.pms.facilities.dto.TechWorkOrderResponse;
import com.panther.pms.facilities.dto.TechnicianResponse;
import com.panther.pms.facilities.dto.UpdateTechWorkOrderRequest;
import com.panther.pms.facilities.dto.UpdateTechnicianRequest;
import com.panther.pms.facilities.entity.TechnicianSpecialization;
import com.panther.pms.facilities.service.TechnicianService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/technicians")
@RequiredArgsConstructor
public class TechnicianController {

    private final TechnicianService technicianService;

    @GetMapping
    @PreAuthorize("hasAnyRole('OPERATIONS', 'OWNER')")
    public PageResponse<TechnicianResponse> list(@RequestParam(required = false) TechnicianSpecialization specialization,
                                                  @RequestParam(required = false) String search,
                                                  Pageable pageable) {
        return technicianService.list(specialization, search, pageable);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OPERATIONS', 'OWNER')")
    public TechnicianResponse get(@PathVariable Long id) {
        return technicianService.get(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('OPERATIONS')")
    public TechnicianResponse create(@Valid @RequestBody CreateTechnicianRequest request) {
        return technicianService.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('OPERATIONS')")
    public TechnicianResponse update(@PathVariable Long id, @Valid @RequestBody UpdateTechnicianRequest request) {
        return technicianService.update(id, request);
    }

    @PostMapping("/{id}/work-orders")
    @PreAuthorize("hasRole('OPERATIONS')")
    public TechWorkOrderResponse addWorkOrder(@PathVariable Long id, @Valid @RequestBody CreateTechWorkOrderRequest request) {
        return technicianService.addWorkOrder(id, request);
    }

    @PutMapping("/{id}/work-orders/{workOrderId}")
    @PreAuthorize("hasRole('OPERATIONS')")
    public TechWorkOrderResponse updateWorkOrder(@PathVariable Long id, @PathVariable Long workOrderId,
                                                  @Valid @RequestBody UpdateTechWorkOrderRequest request) {
        return technicianService.updateWorkOrder(id, workOrderId, request);
    }

    @PostMapping("/{id}/documents")
    @PreAuthorize("hasRole('OPERATIONS')")
    public TechDocumentResponse addDocument(@PathVariable Long id, @Valid @RequestBody CreateTechDocumentRequest request) {
        return technicianService.addDocument(id, request);
    }
}
