package com.panther.pms.facilities.service;

import com.panther.pms.common.EmergencyContact;
import com.panther.pms.common.PageResponse;
import com.panther.pms.common.audit.ActivityType;
import com.panther.pms.common.audit.AuditService;
import com.panther.pms.common.exception.ResourceNotFoundException;
import com.panther.pms.facilities.dto.CreateTechDocumentRequest;
import com.panther.pms.facilities.dto.CreateTechWorkOrderRequest;
import com.panther.pms.facilities.dto.CreateTechnicianRequest;
import com.panther.pms.facilities.dto.TechDocumentResponse;
import com.panther.pms.facilities.dto.TechWorkOrderResponse;
import com.panther.pms.facilities.dto.TechnicianResponse;
import com.panther.pms.facilities.dto.UpdateTechWorkOrderRequest;
import com.panther.pms.facilities.dto.UpdateTechnicianRequest;
import com.panther.pms.leasing.dto.EmergencyContactDto;
import com.panther.pms.facilities.entity.TechDocument;
import com.panther.pms.facilities.entity.TechWorkOrder;
import com.panther.pms.facilities.entity.Technician;
import com.panther.pms.facilities.entity.TechnicianSpecialization;
import com.panther.pms.facilities.repository.TechWorkOrderRepository;
import com.panther.pms.facilities.repository.TechnicianRepository;
import com.panther.pms.facilities.repository.TechnicianSpecifications;
import com.panther.pms.property.entity.Property;
import com.panther.pms.property.entity.Room;
import com.panther.pms.property.repository.PropertyRepository;
import com.panther.pms.property.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Year;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TechnicianService {

    private final TechnicianRepository technicianRepository;
    private final TechWorkOrderRepository techWorkOrderRepository;
    private final PropertyRepository propertyRepository;
    private final RoomRepository roomRepository;
    private final AuditService auditService;

    public PageResponse<TechnicianResponse> list(TechnicianSpecialization specialization, String search, Pageable pageable) {
        var page = technicianRepository.findAll(TechnicianSpecifications.filter(specialization, search), pageable)
                .map(this::toResponse);
        return PageResponse.of(page);
    }

    public TechnicianResponse get(Long id) {
        return toResponse(findOrThrow(id));
    }

    @Transactional
    public TechnicianResponse create(CreateTechnicianRequest request) {
        Technician technician = Technician.builder()
                .name(request.name())
                .company(request.company())
                .contact(request.contact())
                .email(request.email())
                .specialization(request.specialization())
                .hourlyRate(request.hourlyRate())
                .notes(request.notes())
                .address(request.address())
                .nationalId(request.nationalId())
                .emergencyContact(toEmbeddable(request.emergencyContact()))
                .preferredPaymentMethod(request.preferredPaymentMethod())
                .payoutAccount(request.payoutAccount())
                .certifications(request.certifications() != null ? new java.util.ArrayList<>(request.certifications()) : new java.util.ArrayList<>())
                .yearsExperience(request.yearsExperience())
                .build();

        technician = technicianRepository.save(technician);
        auditService.log("Technician Registered", "Technicians", "Added " + technician.getName() + " ("
                + technician.getSpecialization() + ") — " + technician.getCompany(), ActivityType.INFO);
        return toResponse(technician);
    }

    @Transactional
    public TechnicianResponse update(Long id, UpdateTechnicianRequest request) {
        Technician technician = findOrThrow(id);
        technician.setName(request.name());
        technician.setCompany(request.company());
        technician.setContact(request.contact());
        technician.setEmail(request.email());
        technician.setSpecialization(request.specialization());
        technician.setAvailability(request.availability());
        if (request.rating() != null) {
            technician.setRating(request.rating());
        }
        technician.setHourlyRate(request.hourlyRate());
        technician.setNotes(request.notes());
        technician.setAddress(request.address());
        technician.setNationalId(request.nationalId());
        technician.setEmergencyContact(toEmbeddable(request.emergencyContact()));
        technician.setPreferredPaymentMethod(request.preferredPaymentMethod());
        technician.setPayoutAccount(request.payoutAccount());
        technician.getCertifications().clear();
        if (request.certifications() != null) {
            technician.getCertifications().addAll(request.certifications());
        }
        technician.setYearsExperience(request.yearsExperience());

        return toResponse(technicianRepository.save(technician));
    }

    @Transactional
    public TechWorkOrderResponse addWorkOrder(Long technicianId, CreateTechWorkOrderRequest request) {
        Technician technician = findOrThrow(technicianId);
        Property property = propertyRepository.findById(request.propertyId())
                .orElseThrow(() -> ResourceNotFoundException.of("Property", request.propertyId()));
        Room room = request.roomId() != null
                ? roomRepository.findById(request.roomId())
                        .orElseThrow(() -> ResourceNotFoundException.of("Room", request.roomId()))
                : null;

        TechWorkOrder workOrder = TechWorkOrder.builder()
                .technician(technician)
                .jobNumber(generateUniqueJobNumber())
                .property(property)
                .room(room)
                .title(request.title())
                .description(request.description())
                .category(request.category())
                .priority(request.priority() != null ? request.priority() : com.panther.pms.facilities.entity.WorkOrderPriority.MEDIUM)
                .dispatchedDate(request.dispatchedDate())
                .estimatedHours(request.estimatedHours())
                .photos(request.photos() != null ? new java.util.ArrayList<>(request.photos()) : new java.util.ArrayList<>())
                .notes(request.notes())
                .build();

        technician.getWorkOrders().add(0, workOrder);
        // `technician` is already managed here, so save() would merge() rather than persist() —
        // flush() instead to correctly populate the new work order's id in place (see BACKEND_PLAN.md
        // section 10, Phase 3, for the bug this pattern avoids).
        technicianRepository.flush();

        auditService.log("Work Order Dispatched", "Technicians", "Dispatched " + workOrder.getTitle()
                + " (" + workOrder.getJobNumber() + ") to " + technician.getName(), ActivityType.INFO);
        return toResponse(workOrder);
    }

    @Transactional
    public TechWorkOrderResponse updateWorkOrder(Long technicianId, Long workOrderId, UpdateTechWorkOrderRequest request) {
        Technician technician = findOrThrow(technicianId);
        TechWorkOrder workOrder = technician.getWorkOrders().stream()
                .filter(w -> w.getId().equals(workOrderId))
                .findFirst()
                .orElseThrow(() -> ResourceNotFoundException.of("TechWorkOrder", workOrderId));

        if (request.priority() != null) {
            workOrder.setPriority(request.priority());
        }
        workOrder.setStartDate(request.startDate());
        workOrder.setCompletedDate(request.completedDate());
        workOrder.setActualHours(request.actualHours());
        workOrder.setLaborCost(request.laborCost());
        workOrder.setMaterialCost(request.materialCost());
        workOrder.setPaymentStatus(request.paymentStatus());
        if (request.paidAmount() != null) {
            workOrder.setPaidAmount(request.paidAmount());
        }
        workOrder.setStatus(request.status());
        workOrder.setRating(request.rating());
        workOrder.setRatingComment(request.ratingComment());
        if (request.photos() != null) {
            workOrder.getPhotos().clear();
            workOrder.getPhotos().addAll(request.photos());
        }
        workOrder.setNotes(request.notes());

        technicianRepository.save(technician);
        return toResponse(workOrder);
    }

    @Transactional
    public TechDocumentResponse addDocument(Long technicianId, CreateTechDocumentRequest request) {
        Technician technician = findOrThrow(technicianId);
        TechDocument document = TechDocument.builder()
                .technician(technician)
                .name(request.name())
                .type(request.type())
                .fileUrl(request.fileUrl())
                .uploadDate(LocalDate.now())
                .expiryDate(request.expiryDate())
                .status(request.status() != null ? request.status() : com.panther.pms.facilities.entity.TechDocumentStatus.PENDING_REVIEW)
                .build();

        technician.getDocuments().add(0, document);
        technicianRepository.flush();
        return toResponse(document);
    }

    private String generateUniqueJobNumber() {
        String year = String.valueOf(Year.now().getValue());
        String candidate;
        int attempt = (int) techWorkOrderRepository.count() + 1;
        do {
            candidate = "WO-" + year + "-" + String.format("%04d", attempt++);
        } while (techWorkOrderRepository.existsByJobNumber(candidate));
        return candidate;
    }

    private EmergencyContact toEmbeddable(EmergencyContactDto dto) {
        return dto != null ? new EmergencyContact(dto.name(), dto.phone(), dto.relationship()) : null;
    }

    private TechnicianResponse toResponse(Technician t) {
        int totalJobs = (int) techWorkOrderRepository.countByTechnicianId(t.getId());
        BigDecimal totalPaid = techWorkOrderRepository.sumPaidAmountByTechnician(t.getId());

        EmergencyContactDto contact = t.getEmergencyContact() != null
                ? new EmergencyContactDto(t.getEmergencyContact().getName(), t.getEmergencyContact().getPhone(), t.getEmergencyContact().getRelationship())
                : null;

        List<TechWorkOrderResponse> workOrders = t.getWorkOrders().stream().map(this::toResponse).toList();
        List<TechDocumentResponse> documents = t.getDocuments().stream().map(this::toResponse).toList();

        return new TechnicianResponse(t.getId(), t.getName(), t.getCompany(), t.getContact(), t.getEmail(),
                t.getAvatarUrl(), t.getSpecialization(), t.getRating(), t.getAvailability(), totalJobs, totalPaid,
                t.getHourlyRate(), t.getNotes(), t.getAddress(), t.getNationalId(), contact,
                t.getPreferredPaymentMethod(), t.getPayoutAccount(), List.copyOf(t.getCertifications()),
                t.getYearsExperience(), workOrders, documents);
    }

    private TechWorkOrderResponse toResponse(TechWorkOrder w) {
        return new TechWorkOrderResponse(w.getId(), w.getJobNumber(), w.getProperty().getId(), w.getProperty().getName(),
                w.getRoom() != null ? w.getRoom().getId() : null, w.getRoom() != null ? w.getRoom().getRoomNumber() : null,
                w.getTitle(), w.getDescription(), w.getCategory(), w.getPriority(), w.getDispatchedDate(),
                w.getStartDate(), w.getCompletedDate(), w.getEstimatedHours(), w.getActualHours(), w.getLaborCost(),
                w.getMaterialCost(), w.getTotalCost(), w.getPaymentStatus(), w.getPaidAmount(), w.getStatus(),
                w.getRating(), w.getRatingComment(), List.copyOf(w.getPhotos()), w.getNotes());
    }

    private TechDocumentResponse toResponse(TechDocument d) {
        return new TechDocumentResponse(d.getId(), d.getName(), d.getType(), d.getFileUrl(), d.getUploadDate(),
                d.getExpiryDate(), d.getStatus());
    }

    private Technician findOrThrow(Long id) {
        return technicianRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Technician", id));
    }
}
