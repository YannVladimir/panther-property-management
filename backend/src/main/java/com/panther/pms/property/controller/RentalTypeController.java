package com.panther.pms.property.controller;

import com.panther.pms.property.dto.CreateRentalTypeRequest;
import com.panther.pms.property.dto.RentalTypeResponse;
import com.panther.pms.property.dto.UpdateRentalTypeRequest;
import com.panther.pms.property.service.RentalTypeService;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/rental-types")
@RequiredArgsConstructor
public class RentalTypeController {

    private final RentalTypeService rentalTypeService;

    @GetMapping
    public List<RentalTypeResponse> list() {
        return rentalTypeService.list();
    }

    @GetMapping("/{id}")
    public RentalTypeResponse get(@PathVariable Long id) {
        return rentalTypeService.get(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public RentalTypeResponse create(@Valid @RequestBody CreateRentalTypeRequest request) {
        return rentalTypeService.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public RentalTypeResponse update(@PathVariable Long id, @Valid @RequestBody UpdateRentalTypeRequest request) {
        return rentalTypeService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        rentalTypeService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
