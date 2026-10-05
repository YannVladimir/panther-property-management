package com.panther.pms.facilities.service;

import com.panther.pms.common.PageResponse;
import com.panther.pms.common.audit.ActivityType;
import com.panther.pms.common.audit.AuditService;
import com.panther.pms.common.exception.ResourceNotFoundException;
import com.panther.pms.facilities.dto.CreateDamageReportRequest;
import com.panther.pms.facilities.dto.DamageReportResponse;
import com.panther.pms.facilities.dto.UpdateDamageReportRequest;
import com.panther.pms.facilities.dto.UpdateDamageStatusRequest;
import com.panther.pms.facilities.entity.DamageReport;
import com.panther.pms.facilities.entity.DamageStatus;
import com.panther.pms.facilities.repository.DamageReportRepository;
import com.panther.pms.facilities.repository.DamageReportSpecifications;
import com.panther.pms.leasing.entity.Client;
import com.panther.pms.leasing.repository.ClientRepository;
import com.panther.pms.property.entity.Property;
import com.panther.pms.property.entity.Room;
import com.panther.pms.property.repository.PropertyRepository;
import com.panther.pms.property.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DamageReportService {

    private final DamageReportRepository damageReportRepository;
    private final PropertyRepository propertyRepository;
    private final RoomRepository roomRepository;
    private final ClientRepository clientRepository;
    private final AuditService auditService;

    public PageResponse<DamageReportResponse> list(Long propertyId, Long clientId, DamageStatus status, Pageable pageable) {
        var page = damageReportRepository.findAll(DamageReportSpecifications.filter(propertyId, clientId, status), pageable)
                .map(this::toResponse);
        return PageResponse.of(page);
    }

    public DamageReportResponse get(Long id) {
        return toResponse(findOrThrow(id));
    }

    @Transactional
    public DamageReportResponse create(CreateDamageReportRequest request) {
        Property property = propertyRepository.findById(request.propertyId())
                .orElseThrow(() -> ResourceNotFoundException.of("Property", request.propertyId()));
        Room room = roomRepository.findById(request.roomId())
                .orElseThrow(() -> ResourceNotFoundException.of("Room", request.roomId()));
        Client client = resolveClient(request.clientId());

        DamageReport report = DamageReport.builder()
                .property(property)
                .room(room)
                .client(client)
                .item(request.item())
                .damageType(request.damageType())
                .description(request.description())
                .reportedDate(request.reportedDate())
                .photos(request.photos() != null ? new java.util.ArrayList<>(request.photos()) : new java.util.ArrayList<>())
                .responsibleParty(request.responsibleParty())
                .build();
        if (request.estimatedCost() != null) {
            report.setEstimatedCost(request.estimatedCost());
        }
        if (request.amountCharged() != null) {
            report.setAmountCharged(request.amountCharged());
        }

        report = damageReportRepository.save(report);
        auditService.log("Damage Recorded", "Damages", "Reported damage: " + report.getItem() + " in Room "
                + report.getRoom().getRoomNumber() + " ($" + report.getEstimatedCost() + ")", ActivityType.WARNING);
        return toResponse(report);
    }

    @Transactional
    public DamageReportResponse update(Long id, UpdateDamageReportRequest request) {
        DamageReport report = findOrThrow(id);
        report.setClient(resolveClient(request.clientId()));
        report.setItem(request.item());
        report.setDamageType(request.damageType());
        report.setDescription(request.description());
        report.setReportedDate(request.reportedDate());
        report.getPhotos().clear();
        if (request.photos() != null) {
            report.getPhotos().addAll(request.photos());
        }
        if (request.estimatedCost() != null) {
            report.setEstimatedCost(request.estimatedCost());
        }
        if (request.amountCharged() != null) {
            report.setAmountCharged(request.amountCharged());
        }
        report.setResponsibleParty(request.responsibleParty());

        return toResponse(damageReportRepository.save(report));
    }

    @Transactional
    public DamageReportResponse updateStatus(Long id, UpdateDamageStatusRequest request) {
        DamageReport report = findOrThrow(id);
        report.setStatus(request.status());
        if (request.resolutionNotes() != null) {
            report.setResolutionNotes(request.resolutionNotes());
        }
        return toResponse(damageReportRepository.save(report));
    }

    private Client resolveClient(Long clientId) {
        if (clientId == null) {
            return null;
        }
        return clientRepository.findById(clientId)
                .orElseThrow(() -> ResourceNotFoundException.of("Client", clientId));
    }

    private DamageReportResponse toResponse(DamageReport d) {
        return new DamageReportResponse(d.getId(), d.getProperty().getId(), d.getProperty().getName(),
                d.getRoom().getId(), d.getRoom().getRoomNumber(),
                d.getClient() != null ? d.getClient().getId() : null,
                d.getClient() != null ? d.getClient().getName() : null,
                d.getItem(), d.getDamageType(), d.getDescription(), d.getReportedDate(), List.copyOf(d.getPhotos()),
                d.getEstimatedCost(), d.getAmountCharged(), d.getResponsibleParty(), d.getStatus(), d.getResolutionNotes());
    }

    private DamageReport findOrThrow(Long id) {
        return damageReportRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("DamageReport", id));
    }
}
