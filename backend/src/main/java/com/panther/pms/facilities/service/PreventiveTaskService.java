package com.panther.pms.facilities.service;

import com.panther.pms.common.PageResponse;
import com.panther.pms.common.audit.ActivityType;
import com.panther.pms.common.audit.AuditService;
import com.panther.pms.common.exception.ResourceNotFoundException;
import com.panther.pms.facilities.dto.CreatePreventiveTaskRequest;
import com.panther.pms.facilities.dto.PreventiveTaskResponse;
import com.panther.pms.facilities.dto.UpdatePreventiveTaskStatusRequest;
import com.panther.pms.facilities.entity.InspectionStatus;
import com.panther.pms.facilities.entity.PreventiveTask;
import com.panther.pms.facilities.repository.PreventiveTaskRepository;
import com.panther.pms.facilities.repository.PreventiveTaskSpecifications;
import com.panther.pms.property.entity.Property;
import com.panther.pms.property.repository.PropertyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PreventiveTaskService {

    private final PreventiveTaskRepository preventiveTaskRepository;
    private final PropertyRepository propertyRepository;
    private final AuditService auditService;

    public PageResponse<PreventiveTaskResponse> list(Long propertyId, InspectionStatus status, Pageable pageable) {
        var page = preventiveTaskRepository.findAll(PreventiveTaskSpecifications.filter(propertyId, status), pageable)
                .map(this::toResponse);
        return PageResponse.of(page);
    }

    public PageResponse<PreventiveTaskResponse> listByAssignedStaff(Long staffId, Pageable pageable) {
        return PageResponse.of(preventiveTaskRepository.findByAssignedStaffId(staffId, pageable).map(this::toResponse));
    }

    @Transactional
    public PreventiveTaskResponse create(CreatePreventiveTaskRequest request) {
        Property property = propertyRepository.findById(request.propertyId())
                .orElseThrow(() -> ResourceNotFoundException.of("Property", request.propertyId()));

        PreventiveTask task = PreventiveTask.builder()
                .property(property)
                .category(request.category())
                .taskName(request.taskName())
                .frequency(request.frequency())
                .scheduleWeek(request.scheduleWeek())
                .assignedStaffId(request.assignedStaffId())
                .assignedStaffName(request.assignedStaffName())
                .dueDate(request.dueDate())
                .build();

        return toResponse(preventiveTaskRepository.save(task));
    }

    @Transactional
    public PreventiveTaskResponse updateStatus(Long id, UpdatePreventiveTaskStatusRequest request) {
        PreventiveTask task = findOrThrow(id);
        task.setStatus(request.status());
        if (request.remarks() != null) {
            task.setRemarks(request.remarks());
        }
        if (request.evidencePhotos() != null && !request.evidencePhotos().isEmpty()) {
            task.getEvidencePhotos().clear();
            task.getEvidencePhotos().addAll(request.evidencePhotos());
        }
        task.setLastCompletedDate(LocalDate.now());
        if (request.status() == InspectionStatus.PASS || request.status() == InspectionStatus.NOT_APPLICABLE) {
            task.setResolvedDate(LocalDate.now());
        }

        task = preventiveTaskRepository.save(task);
        ActivityType logType = switch (request.status()) {
            case PASS -> ActivityType.SUCCESS;
            case NEEDS_ATTENTION, FAILED -> ActivityType.WARNING;
            default -> ActivityType.INFO;
        };
        auditService.log("Preventive Task Inspected", "Preventive Maintenance",
                "Marked \"" + task.getTaskName() + "\" as " + request.status(), logType);
        return toResponse(task);
    }

    private PreventiveTaskResponse toResponse(PreventiveTask t) {
        return new PreventiveTaskResponse(t.getId(), t.getProperty().getId(), t.getProperty().getName(), t.getCategory(),
                t.getTaskName(), t.getFrequency(), t.getScheduleWeek(), t.getAssignedStaffId(), t.getAssignedStaffName(),
                t.getStatus(), t.getRemarks(), List.copyOf(t.getEvidencePhotos()), t.getLastCompletedDate(),
                t.getDueDate(), t.getResolvedDate());
    }

    private PreventiveTask findOrThrow(Long id) {
        return preventiveTaskRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("PreventiveTask", id));
    }
}
