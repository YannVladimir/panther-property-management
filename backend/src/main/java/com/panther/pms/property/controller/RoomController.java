package com.panther.pms.property.controller;

import com.panther.pms.common.PageResponse;
import com.panther.pms.property.dto.CreateRoomRequest;
import com.panther.pms.property.dto.RoomResponse;
import com.panther.pms.property.dto.UpdateRoomRequest;
import com.panther.pms.property.dto.UpdateRoomStatusRequest;
import com.panther.pms.property.entity.FurnishingType;
import com.panther.pms.property.entity.RoomStatus;
import com.panther.pms.property.service.RoomService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/v1/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;

    @GetMapping
    public PageResponse<RoomResponse> list(@RequestParam(required = false) Long propertyId,
                                            @RequestParam(required = false) RoomStatus status,
                                            @RequestParam(required = false) FurnishingType furnishingType,
                                            @RequestParam(required = false) BigDecimal minPrice,
                                            @RequestParam(required = false) BigDecimal maxPrice,
                                            @RequestParam(required = false) String search,
                                            Pageable pageable) {
        return roomService.list(propertyId, status, furnishingType, minPrice, maxPrice, search, pageable);
    }

    @GetMapping("/{id}")
    public RoomResponse get(@PathVariable Long id) {
        return roomService.get(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public RoomResponse create(@Valid @RequestBody CreateRoomRequest request) {
        return roomService.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public RoomResponse update(@PathVariable Long id, @Valid @RequestBody UpdateRoomRequest request) {
        return roomService.update(id, request);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('OPERATIONS', 'ADMIN')")
    public RoomResponse updateStatus(@PathVariable Long id, @Valid @RequestBody UpdateRoomStatusRequest request) {
        return roomService.updateStatus(id, request.status());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        roomService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
