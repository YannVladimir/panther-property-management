package com.panther.pms.leasing.controller;

import com.panther.pms.common.PageResponse;
import com.panther.pms.leasing.dto.BookingResponse;
import com.panther.pms.leasing.dto.ClientDocumentResponse;
import com.panther.pms.leasing.dto.ClientMaterialResponse;
import com.panther.pms.leasing.dto.ClientResponse;
import com.panther.pms.leasing.dto.CreateClientDocumentRequest;
import com.panther.pms.leasing.dto.CreateClientMaterialRequest;
import com.panther.pms.leasing.dto.CreateClientRequest;
import com.panther.pms.leasing.dto.UpdateClientMaterialConditionRequest;
import com.panther.pms.leasing.dto.UpdateClientRequest;
import com.panther.pms.leasing.dto.UpdateClientStatusRequest;
import com.panther.pms.leasing.entity.ClientStatus;
import com.panther.pms.leasing.service.BookingService;
import com.panther.pms.leasing.service.ClientService;
import com.panther.pms.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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

@RestController
@RequestMapping("/api/v1/clients")
@RequiredArgsConstructor
public class ClientController {

    private final ClientService clientService;
    private final BookingService bookingService;

    @GetMapping
    @PreAuthorize("hasRole('OPERATIONS')")
    public PageResponse<ClientResponse> list(@RequestParam(required = false) ClientStatus status,
                                              @RequestParam(required = false) String search,
                                              Pageable pageable) {
        return clientService.list(status, search, pageable);
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('CLIENT')")
    public ClientResponse me(@AuthenticationPrincipal UserPrincipal principal) {
        return clientService.get(principal.getClientId());
    }

    @GetMapping("/me/bookings")
    @PreAuthorize("hasRole('CLIENT')")
    public PageResponse<BookingResponse> myBookings(@AuthenticationPrincipal UserPrincipal principal, Pageable pageable) {
        return bookingService.listByClient(principal.getClientId(), pageable);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('OPERATIONS') or (hasRole('CLIENT') and principal.clientId == #id)")
    public ClientResponse get(@PathVariable Long id) {
        return clientService.get(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('OPERATIONS')")
    public ClientResponse create(@Valid @RequestBody CreateClientRequest request) {
        return clientService.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('OPERATIONS')")
    public ClientResponse update(@PathVariable Long id, @Valid @RequestBody UpdateClientRequest request) {
        return clientService.update(id, request);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('OPERATIONS')")
    public ClientResponse updateStatus(@PathVariable Long id, @Valid @RequestBody UpdateClientStatusRequest request) {
        return clientService.updateStatus(id, request.status(), request.reason());
    }

    @GetMapping("/{id}/documents")
    @PreAuthorize("hasRole('OPERATIONS') or (hasRole('CLIENT') and principal.clientId == #id)")
    public java.util.List<ClientDocumentResponse> documents(@PathVariable Long id) {
        return clientService.get(id).documents();
    }

    @PostMapping("/{id}/documents")
    @PreAuthorize("hasRole('OPERATIONS')")
    public ClientDocumentResponse addDocument(@PathVariable Long id, @Valid @RequestBody CreateClientDocumentRequest request) {
        return clientService.addDocument(id, request);
    }

    @DeleteMapping("/{id}/documents/{documentId}")
    @PreAuthorize("hasRole('OPERATIONS')")
    public ResponseEntity<Void> deleteDocument(@PathVariable Long id, @PathVariable Long documentId) {
        clientService.deleteDocument(id, documentId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/materials")
    @PreAuthorize("hasRole('OPERATIONS') or (hasRole('CLIENT') and principal.clientId == #id)")
    public java.util.List<ClientMaterialResponse> materials(@PathVariable Long id) {
        return clientService.get(id).materials();
    }

    @PostMapping("/{id}/materials")
    @PreAuthorize("hasRole('OPERATIONS')")
    public ClientMaterialResponse addMaterial(@PathVariable Long id, @Valid @RequestBody CreateClientMaterialRequest request) {
        return clientService.addMaterial(id, request);
    }

    @PatchMapping("/{id}/materials/{materialId}/condition")
    @PreAuthorize("hasRole('OPERATIONS') or (hasRole('CLIENT') and principal.clientId == #id)")
    public ClientMaterialResponse updateMaterialCondition(@PathVariable Long id, @PathVariable Long materialId,
                                                           @Valid @RequestBody UpdateClientMaterialConditionRequest request) {
        return clientService.updateMaterialCondition(id, materialId, request.condition());
    }

    @DeleteMapping("/{id}/materials/{materialId}")
    @PreAuthorize("hasRole('OPERATIONS')")
    public ResponseEntity<Void> deleteMaterial(@PathVariable Long id, @PathVariable Long materialId) {
        clientService.deleteMaterial(id, materialId);
        return ResponseEntity.noContent().build();
    }
}
