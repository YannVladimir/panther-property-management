package com.panther.pms.property.controller;

import com.panther.pms.property.dto.BuildingResponse;
import com.panther.pms.property.dto.CreateBuildingRequest;
import com.panther.pms.property.dto.UpdateBuildingRequest;
import com.panther.pms.property.service.BuildingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
@RequestMapping("/api/v1/buildings")
@RequiredArgsConstructor
public class BuildingController {

    private final BuildingService buildingService;

    @GetMapping
    public List<BuildingResponse> list(@RequestParam(required = false) Long propertyId) {
        return buildingService.listByProperty(propertyId);
    }

    @GetMapping("/{id}")
    public BuildingResponse get(@PathVariable Long id) {
        return buildingService.get(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public BuildingResponse create(@Valid @RequestBody CreateBuildingRequest request) {
        return buildingService.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public BuildingResponse update(@PathVariable Long id, @Valid @RequestBody UpdateBuildingRequest request) {
        return buildingService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        buildingService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
