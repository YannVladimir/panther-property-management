package com.panther.pms.facilities.service;

import com.panther.pms.common.PageResponse;
import com.panther.pms.common.audit.ActivityType;
import com.panther.pms.common.audit.AuditService;
import com.panther.pms.common.exception.ResourceNotFoundException;
import com.panther.pms.facilities.dto.CreateMaintenanceIssueRequest;
import com.panther.pms.facilities.dto.MaintenanceIssueResponse;
import com.panther.pms.facilities.dto.UpdateMaintenanceIssueStatusRequest;
import com.panther.pms.facilities.entity.IssuePriority;
import com.panther.pms.facilities.entity.IssueStatus;
import com.panther.pms.facilities.entity.MaintenanceIssue;
import com.panther.pms.facilities.entity.Technician;
import com.panther.pms.facilities.repository.MaintenanceIssueRepository;
import com.panther.pms.facilities.repository.MaintenanceIssueSpecifications;
import com.panther.pms.facilities.repository.TechnicianRepository;
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

import java.time.Instant;
import java.time.LocalDate;
import java.time.Year;

@Service
@RequiredArgsConstructor
public class MaintenanceIssueService {

    private final MaintenanceIssueRepository maintenanceIssueRepository;
    private final ClientRepository clientRepository;
    private final PropertyRepository propertyRepository;
    private final RoomRepository roomRepository;
    private final TechnicianRepository technicianRepository;
    private final AuditService auditService;

    public PageResponse<MaintenanceIssueResponse> list(IssueStatus status, Long propertyId, Long clientId, Pageable pageable) {
        var page = maintenanceIssueRepository.findAll(MaintenanceIssueSpecifications.filter(status, propertyId, clientId), pageable)
                .map(this::toResponse);
        return PageResponse.of(page);
    }

    public MaintenanceIssueResponse get(Long id) {
        return toResponse(findOrThrow(id));
    }

    public PageResponse<MaintenanceIssueResponse> listByClient(Long clientId, Pageable pageable) {
        return PageResponse.of(maintenanceIssueRepository.findByClientId(clientId, pageable).map(this::toResponse));
    }

    @Transactional
    public MaintenanceIssueResponse create(Long clientId, CreateMaintenanceIssueRequest request) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> ResourceNotFoundException.of("Client", clientId));
        Property property = propertyRepository.findById(request.propertyId())
                .orElseThrow(() -> ResourceNotFoundException.of("Property", request.propertyId()));
        Room room = roomRepository.findById(request.roomId())
                .orElseThrow(() -> ResourceNotFoundException.of("Room", request.roomId()));

        MaintenanceIssue issue = MaintenanceIssue.builder()
                .ticketNumber(generateUniqueTicketNumber())
                .client(client)
                .property(property)
                .room(room)
                .category(request.category())
                .title(request.title())
                .description(request.description())
                .priority(request.priority() != null ? request.priority() : IssuePriority.MEDIUM)
                .reportedDate(Instant.now())
                .status(IssueStatus.SUBMITTED)
                .photos(request.photos() != null ? new java.util.ArrayList<>(request.photos()) : new java.util.ArrayList<>())
                .build();

        issue = maintenanceIssueRepository.save(issue);
        auditService.log("Issue Reported", "Maintenance", issue.getTitle() + " reported for Room "
                + issue.getRoom().getRoomNumber(), ActivityType.WARNING);
        return toResponse(issue);
    }

    @Transactional
    public MaintenanceIssueResponse updateStatus(Long id, UpdateMaintenanceIssueStatusRequest request) {
        MaintenanceIssue issue = findOrThrow(id);
        issue.setStatus(request.status());

        if (request.assignedTechnicianId() != null) {
            Technician technician = technicianRepository.findById(request.assignedTechnicianId())
                    .orElseThrow(() -> ResourceNotFoundException.of("Technician", request.assignedTechnicianId()));
            issue.setAssignedTechnician(technician);
        }
        if (request.notes() != null) {
            issue.setResolutionNotes(request.notes());
        }
        if (request.status() == IssueStatus.RESOLVED) {
            issue.setResolutionDate(LocalDate.now());
        }

        return toResponse(maintenanceIssueRepository.save(issue));
    }

    private String generateUniqueTicketNumber() {
        String year = String.valueOf(Year.now().getValue());
        String candidate;
        int attempt = (int) maintenanceIssueRepository.count() + 1;
        do {
            candidate = "TKT-" + year + "-" + String.format("%04d", attempt++);
        } while (maintenanceIssueRepository.existsByTicketNumber(candidate));
        return candidate;
    }

    private MaintenanceIssueResponse toResponse(MaintenanceIssue i) {
        Technician tech = i.getAssignedTechnician();
        return new MaintenanceIssueResponse(i.getId(), i.getTicketNumber(), i.getClient().getId(), i.getClient().getName(),
                i.getProperty().getId(), i.getProperty().getName(), i.getRoom().getId(), i.getRoom().getRoomNumber(),
                i.getCategory(), i.getTitle(), i.getDescription(), i.getPriority(), java.util.List.copyOf(i.getPhotos()),
                i.getStatus(), i.getReportedDate(),
                tech != null ? tech.getId() : null, tech != null ? tech.getName() : null,
                tech != null ? tech.getSpecialization().name() : null,
                i.getResolutionDate(), i.getResolutionNotes());
    }

    private MaintenanceIssue findOrThrow(Long id) {
        return maintenanceIssueRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("MaintenanceIssue", id));
    }
}
