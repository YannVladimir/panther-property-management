package com.panther.pms.property.controller;

import com.panther.pms.common.PageResponse;
import com.panther.pms.property.dto.BuildingResponse;
import com.panther.pms.property.dto.CreatePropertyRequest;
import com.panther.pms.property.dto.PropertyResponse;
import com.panther.pms.property.dto.UpdatePropertyRequest;
import com.panther.pms.property.entity.PropertyStatus;
import com.panther.pms.property.service.BuildingService;
import com.panther.pms.property.service.PropertyService;
import com.panther.pms.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/properties")
@RequiredArgsConstructor
public class PropertyController {

    private final PropertyService propertyService;
    private final BuildingService buildingService;

    @GetMapping
    public PageResponse<PropertyResponse> list(@AuthenticationPrincipal UserPrincipal principal,
                                                @RequestParam(required = false) PropertyStatus status,
                                                @RequestParam(required = false) String search,
                                                Pageable pageable) {
        return propertyService.list(status, search, principal == null, pageable);
    }

    @GetMapping("/{id}")
    public PropertyResponse get(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id) {
        return propertyService.get(id, principal == null);
    }

    @GetMapping("/{id}/buildings")
    public List<BuildingResponse> buildings(@PathVariable Long id) {
        return buildingService.listByProperty(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public PropertyResponse create(@Valid @RequestBody CreatePropertyRequest request) {
        return propertyService.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public PropertyResponse update(@PathVariable Long id, @Valid @RequestBody UpdatePropertyRequest request) {
        return propertyService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        propertyService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
