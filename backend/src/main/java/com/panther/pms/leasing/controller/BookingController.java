package com.panther.pms.leasing.controller;

import com.panther.pms.common.PageResponse;
import com.panther.pms.leasing.dto.AssignRoomRequest;
import com.panther.pms.leasing.dto.BookingResponse;
import com.panther.pms.leasing.dto.CreateBookingRequest;
import com.panther.pms.leasing.dto.UpdateBookingStatusRequest;
import com.panther.pms.leasing.entity.BookingStatus;
import com.panther.pms.leasing.service.BookingService;
import com.panther.pms.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PostAuthorize;
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
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @GetMapping
    @PreAuthorize("hasRole('OPERATIONS')")
    public PageResponse<BookingResponse> list(@RequestParam(required = false) BookingStatus status,
                                               @RequestParam(required = false) Long propertyId,
                                               @RequestParam(required = false) String search,
                                               Pageable pageable) {
        return bookingService.list(status, propertyId, search, pageable);
    }

    @GetMapping("/{id}")
    @PostAuthorize("hasRole('OPERATIONS') or (hasRole('CLIENT') and returnObject.clientId == principal.clientId)")
    public BookingResponse get(@PathVariable Long id) {
        return bookingService.get(id);
    }

    /** Open to the public: an anonymous visitor can submit a booking inquiry without an account. */
    @PostMapping
    public BookingResponse create(@AuthenticationPrincipal UserPrincipal principal,
                                   @Valid @RequestBody CreateBookingRequest request) {
        return bookingService.create(request, principal != null ? principal.getName() : null);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('OPERATIONS')")
    public BookingResponse updateStatus(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id,
                                         @Valid @RequestBody UpdateBookingStatusRequest request) {
        return bookingService.updateStatus(id, request.status(), request.note(), principal.getName());
    }

    @PatchMapping("/{id}/assign-room")
    @PreAuthorize("hasRole('OPERATIONS')")
    public BookingResponse assignRoom(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id,
                                       @Valid @RequestBody AssignRoomRequest request) {
        return bookingService.assignRoom(id, request.roomId(), principal.getName());
    }
}
