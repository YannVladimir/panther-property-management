package com.panther.pms.leasing.service;

import com.panther.pms.common.EmergencyContact;
import com.panther.pms.common.PageResponse;
import com.panther.pms.common.audit.ActivityType;
import com.panther.pms.common.audit.AuditService;
import com.panther.pms.common.exception.ConflictException;
import com.panther.pms.common.exception.ResourceNotFoundException;
import com.panther.pms.leasing.dto.ClientDocumentResponse;
import com.panther.pms.leasing.dto.ClientMaterialResponse;
import com.panther.pms.leasing.dto.ClientResponse;
import com.panther.pms.leasing.dto.CreateClientDocumentRequest;
import com.panther.pms.leasing.dto.CreateClientMaterialRequest;
import com.panther.pms.leasing.dto.CreateClientRequest;
import com.panther.pms.leasing.dto.EmergencyContactDto;
import com.panther.pms.leasing.dto.UpdateClientRequest;
import com.panther.pms.leasing.entity.Client;
import com.panther.pms.leasing.entity.ClientDocument;
import com.panther.pms.leasing.entity.ClientDocumentStatus;
import com.panther.pms.leasing.entity.ClientMaterial;
import com.panther.pms.leasing.entity.ClientStatus;
import com.panther.pms.leasing.repository.ClientRepository;
import com.panther.pms.leasing.repository.ClientSpecifications;
import com.panther.pms.property.entity.Property;
import com.panther.pms.property.entity.Room;
import com.panther.pms.property.entity.RentalTypeIncludedMaterial;
import com.panther.pms.property.repository.PropertyRepository;
import com.panther.pms.property.repository.RentalTypeIncludedMaterialRepository;
import com.panther.pms.property.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ClientService {

    private final ClientRepository clientRepository;
    private final RoomRepository roomRepository;
    private final PropertyRepository propertyRepository;
    private final RentalTypeIncludedMaterialRepository rentalTypeIncludedMaterialRepository;
    private final AuditService auditService;

    public PageResponse<ClientResponse> list(ClientStatus status, String search, Pageable pageable) {
        var page = clientRepository.findAll(ClientSpecifications.filter(status, search), pageable)
                .map(this::toResponse);
        return PageResponse.of(page);
    }

    public ClientResponse get(Long id) {
        return toResponse(findOrThrow(id));
    }

    @Transactional
    public ClientResponse create(CreateClientRequest request) {
        if (clientRepository.existsByEmailIgnoreCase(request.email())) {
            throw new ConflictException("A resident with this email already exists.");
        }

        Client client = Client.builder()
                .name(request.name())
                .email(request.email())
                .phone(request.phone())
                .avatarUrl(request.avatarUrl())
                .identificationNumber(request.identificationNumber())
                .nationality(request.nationality())
                .occupation(request.occupation())
                .employer(request.employer())
                .emergencyContact(toEmbeddable(request.emergencyContact()))
                .currentRoom(resolveRoom(request.currentRoomId()))
                .currentProperty(resolveProperty(request.currentPropertyId()))
                .rentalType(request.rentalType())
                .moveInDate(request.moveInDate())
                .leaseExpiryDate(request.leaseExpiryDate())
                .monthlyRent(request.monthlyRent())
                .notes(request.notes())
                .build();

        if (request.depositPaid() != null) {
            client.setDepositPaid(request.depositPaid());
        }

        client = clientRepository.save(client);
        auditService.log("Resident Registered", "Clients", "Created new resident account for " + client.getName(), ActivityType.SUCCESS);
        return toResponse(client);
    }

    @Transactional
    public ClientResponse update(Long id, UpdateClientRequest request) {
        Client client = findOrThrow(id);

        if (!client.getEmail().equalsIgnoreCase(request.email())
                && clientRepository.existsByEmailIgnoreCase(request.email())) {
            throw new ConflictException("A resident with this email already exists.");
        }

        client.setName(request.name());
        client.setEmail(request.email());
        client.setPhone(request.phone());
        client.setAvatarUrl(request.avatarUrl());
        client.setIdentificationNumber(request.identificationNumber());
        client.setNationality(request.nationality());
        client.setOccupation(request.occupation());
        client.setEmployer(request.employer());
        client.setEmergencyContact(toEmbeddable(request.emergencyContact()));
        client.setCurrentRoom(resolveRoom(request.currentRoomId()));
        client.setCurrentProperty(resolveProperty(request.currentPropertyId()));
        client.setRentalType(request.rentalType());
        client.setMoveInDate(request.moveInDate());
        client.setLeaseExpiryDate(request.leaseExpiryDate());
        client.setMonthlyRent(request.monthlyRent());
        if (request.depositPaid() != null) {
            client.setDepositPaid(request.depositPaid());
        }
        client.setNotes(request.notes());

        client = clientRepository.save(client);
        auditService.log("Client Updated", "Clients", "Updated profile for " + client.getName(), ActivityType.INFO);
        return toResponse(client);
    }

    @Transactional
    public ClientResponse updateStatus(Long id, ClientStatus status, String reason) {
        Client client = findOrThrow(id);
        client.setStatus(status);
        if (status == ClientStatus.ACTIVE) {
            client.setDeactivationReason(null);
            client.setDeactivatedDate(null);
        } else {
            client.setDeactivationReason(reason != null ? reason : client.getDeactivationReason());
            client.setDeactivatedDate(LocalDate.now());
        }
        client = clientRepository.save(client);
        auditService.log("Client Status Changed", "Clients", client.getName() + " status set to " + status
                + (reason != null ? " (" + reason + ")" : ""), status == ClientStatus.ACTIVE ? ActivityType.SUCCESS : ActivityType.WARNING);
        return toResponse(client);
    }

    @Transactional
    public ClientDocumentResponse addDocument(Long clientId, CreateClientDocumentRequest request) {
        Client client = findOrThrow(clientId);
        ClientDocument document = ClientDocument.builder()
                .client(client)
                .name(request.name())
                .type(request.type())
                .fileUrl(request.fileUrl())
                .uploadDate(LocalDate.now())
                .sizeLabel(request.sizeLabel())
                .status(request.status() != null ? request.status() : ClientDocumentStatus.PENDING_REVIEW)
                .build();
        client.getDocuments().add(0, document);
        // `client` is already managed in this transaction, so save() would merge() rather than
        // persist() — merging a transient child returns a *new* instance and never sets the id
        // on `document`. flush() instead, which cascade-persists the existing managed graph in place.
        clientRepository.flush();
        return toResponse(document);
    }

    @Transactional
    public void deleteDocument(Long clientId, Long documentId) {
        Client client = findOrThrow(clientId);
        client.getDocuments().removeIf(d -> d.getId().equals(documentId));
        clientRepository.save(client);
    }

    @Transactional
    public ClientMaterialResponse addMaterial(Long clientId, CreateClientMaterialRequest request) {
        Client client = findOrThrow(clientId);
        RentalTypeIncludedMaterial templateItem = request.rentalTypeItemId() != null
                ? rentalTypeIncludedMaterialRepository.findById(request.rentalTypeItemId())
                        .orElseThrow(() -> ResourceNotFoundException.of("RentalTypeIncludedMaterial", request.rentalTypeItemId()))
                : null;

        ClientMaterial material = ClientMaterial.builder()
                .client(client)
                .rentalTypeItem(templateItem)
                .name(request.name())
                .quantity(request.quantity())
                .condition(request.condition())
                .assignedDate(LocalDate.now())
                .serialNumber(request.serialNumber())
                .category(request.category())
                .build();
        client.getMaterials().add(0, material);
        clientRepository.flush();
        return toResponse(material);
    }

    @Transactional
    public void deleteMaterial(Long clientId, Long materialId) {
        Client client = findOrThrow(clientId);
        client.getMaterials().removeIf(m -> m.getId().equals(materialId));
        clientRepository.save(client);
    }

    @Transactional
    public ClientMaterialResponse updateMaterialCondition(Long clientId, Long materialId,
                                                           com.panther.pms.leasing.entity.ClientMaterialCondition condition) {
        Client client = findOrThrow(clientId);
        ClientMaterial material = client.getMaterials().stream()
                .filter(m -> m.getId().equals(materialId))
                .findFirst()
                .orElseThrow(() -> ResourceNotFoundException.of("ClientMaterial", materialId));
        material.setCondition(condition);
        clientRepository.save(client);
        return toResponse(material);
    }

    private EmergencyContact toEmbeddable(EmergencyContactDto dto) {
        if (dto == null || (isBlank(dto.name()) && isBlank(dto.phone()) && isBlank(dto.relationship()))) {
            return null;
        }
        return new EmergencyContact(dto.name(), dto.phone(), dto.relationship());
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private Room resolveRoom(Long roomId) {
        if (roomId == null) {
            return null;
        }
        return roomRepository.findById(roomId)
                .orElseThrow(() -> ResourceNotFoundException.of("Room", roomId));
    }

    private Property resolveProperty(Long propertyId) {
        if (propertyId == null) {
            return null;
        }
        return propertyRepository.findById(propertyId)
                .orElseThrow(() -> ResourceNotFoundException.of("Property", propertyId));
    }

    ClientResponse toResponse(Client c) {
        EmergencyContactDto contact = c.getEmergencyContact() != null
                ? new EmergencyContactDto(c.getEmergencyContact().getName(), c.getEmergencyContact().getPhone(), c.getEmergencyContact().getRelationship())
                : null;

        List<ClientMaterialResponse> materials = c.getMaterials().stream().map(this::toResponse).toList();
        List<ClientDocumentResponse> documents = c.getDocuments().stream().map(this::toResponse).toList();

        return new ClientResponse(
                c.getId(), c.getUserId(), c.getName(), c.getEmail(), c.getPhone(), c.getAvatarUrl(),
                c.getIdentificationNumber(), c.getNationality(), c.getOccupation(), c.getEmployer(), contact,
                c.getCurrentRoom() != null ? c.getCurrentRoom().getId() : null,
                c.getCurrentRoom() != null ? c.getCurrentRoom().getRoomNumber() : null,
                c.getCurrentProperty() != null ? c.getCurrentProperty().getId() : null,
                c.getCurrentProperty() != null ? c.getCurrentProperty().getName() : null,
                c.getRentalType(), c.getMoveInDate(), c.getLeaseExpiryDate(), c.getMonthlyRent(), c.getDepositPaid(),
                c.getPaymentStatus(), c.getStatus(), c.getDeactivationReason(), c.getDeactivatedDate(), c.getNotes(),
                materials, documents
        );
    }

    private ClientMaterialResponse toResponse(ClientMaterial m) {
        return new ClientMaterialResponse(m.getId(), m.getRentalTypeItem() != null ? m.getRentalTypeItem().getId() : null,
                m.getName(), m.getQuantity(), m.getCondition(), m.getAssignedDate(), m.getSerialNumber(), m.getCategory());
    }

    private ClientDocumentResponse toResponse(ClientDocument d) {
        return new ClientDocumentResponse(d.getId(), d.getName(), d.getType(), d.getFileUrl(), d.getUploadDate(),
                d.getSizeLabel(), d.getStatus());
    }

    Client findOrThrow(Long id) {
        return clientRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Client", id));
    }
}
