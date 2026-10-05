package com.panther.pms.hr.service;

import com.panther.pms.common.EmergencyContact;
import com.panther.pms.common.PageResponse;
import com.panther.pms.common.audit.ActivityType;
import com.panther.pms.common.audit.AuditService;
import com.panther.pms.common.exception.ConflictException;
import com.panther.pms.common.exception.ResourceNotFoundException;
import com.panther.pms.hr.dto.CreateEmployeeDailyTaskRequest;
import com.panther.pms.hr.dto.CreateEmployeeDamageRequest;
import com.panther.pms.hr.dto.CreateEmployeeDocumentRequest;
import com.panther.pms.hr.dto.CreateEmployeeLeaveRequest;
import com.panther.pms.hr.dto.CreateEmployeeRequest;
import com.panther.pms.hr.dto.EmployeeDailyTaskResponse;
import com.panther.pms.hr.dto.EmployeeDamageResponse;
import com.panther.pms.hr.dto.EmployeeDocumentResponse;
import com.panther.pms.hr.dto.EmployeeLeaveResponse;
import com.panther.pms.hr.dto.EmployeeResponse;
import com.panther.pms.hr.dto.UpdateEmployeeDailyTaskRequest;
import com.panther.pms.hr.dto.UpdateEmployeeLeaveRequest;
import com.panther.pms.hr.dto.UpdateEmployeeRequest;
import com.panther.pms.leasing.dto.EmergencyContactDto;
import com.panther.pms.hr.entity.Department;
import com.panther.pms.hr.entity.Employee;
import com.panther.pms.hr.entity.EmployeeDailyTask;
import com.panther.pms.hr.entity.EmployeeDamage;
import com.panther.pms.hr.entity.EmployeeDocument;
import com.panther.pms.hr.entity.EmployeeLeave;
import com.panther.pms.hr.entity.EmployeeStatus;
import com.panther.pms.hr.entity.LeaveStatus;
import com.panther.pms.hr.repository.EmployeeRepository;
import com.panther.pms.hr.repository.EmployeeSpecifications;
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
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final PropertyRepository propertyRepository;
    private final AuditService auditService;

    public PageResponse<EmployeeResponse> list(Department department, EmployeeStatus status, String search, Pageable pageable) {
        var page = employeeRepository.findAll(EmployeeSpecifications.filter(department, status, search), pageable)
                .map(this::toResponse);
        return PageResponse.of(page);
    }

    public EmployeeResponse get(Long id) {
        return toResponse(findOrThrow(id));
    }

    @Transactional
    public EmployeeResponse create(CreateEmployeeRequest request) {
        if (request.nationalId() != null && employeeRepository.existsByNationalId(request.nationalId())) {
            throw new ConflictException("An employee with this national ID already exists.");
        }

        Employee employee = Employee.builder()
                .name(request.name())
                .position(request.position())
                .department(request.department())
                .contact(request.contact())
                .email(request.email())
                .employmentStatus(request.employmentStatus())
                .startDate(request.startDate())
                .basicSalary(request.basicSalary())
                .nationalId(request.nationalId())
                .emergencyContact(toEmbeddable(request.emergencyContact()))
                .address(request.address())
                .build();

        employee = employeeRepository.save(employee);
        auditService.log("Employee Added", "HR & Payroll", "Registered new staff member " + employee.getName()
                + " (" + employee.getPosition() + ")", ActivityType.INFO);
        return toResponse(employee);
    }

    @Transactional
    public EmployeeResponse update(Long id, UpdateEmployeeRequest request) {
        Employee employee = findOrThrow(id);

        if (request.nationalId() != null && !request.nationalId().equals(employee.getNationalId())
                && employeeRepository.existsByNationalId(request.nationalId())) {
            throw new ConflictException("An employee with this national ID already exists.");
        }

        employee.setName(request.name());
        employee.setPosition(request.position());
        employee.setDepartment(request.department());
        employee.setContact(request.contact());
        employee.setEmail(request.email());
        employee.setEmploymentStatus(request.employmentStatus());
        employee.setStartDate(request.startDate());
        employee.setBasicSalary(request.basicSalary());
        employee.setNationalId(request.nationalId());
        employee.setEmergencyContact(toEmbeddable(request.emergencyContact()));
        employee.setAddress(request.address());

        employee = employeeRepository.save(employee);
        auditService.log("Employee Updated", "HR & Payroll", "Updated dossier for " + employee.getName(), ActivityType.INFO);
        return toResponse(employee);
    }

    @Transactional
    public EmployeeResponse updateStatus(Long id, EmployeeStatus status, String reason) {
        Employee employee = findOrThrow(id);
        employee.setStatus(status);
        employee.setStatusReason(reason != null ? reason : employee.getStatusReason());
        employee = employeeRepository.save(employee);
        auditService.log("Employee Status Changed", "HR & Payroll", "Changed " + employee.getName() + "'s status to "
                + status + (reason != null ? " (" + reason + ")" : ""),
                status == EmployeeStatus.ACTIVE ? ActivityType.SUCCESS : ActivityType.WARNING);
        return toResponse(employee);
    }

    @Transactional
    public EmployeeDocumentResponse addDocument(Long employeeId, CreateEmployeeDocumentRequest request) {
        Employee employee = findOrThrow(employeeId);
        EmployeeDocument document = EmployeeDocument.builder()
                .employee(employee)
                .name(request.name())
                .type(request.type())
                .fileUrl(request.fileUrl())
                .uploadDate(LocalDate.now())
                .sizeLabel(request.sizeLabel())
                .status(request.status() != null ? request.status() : com.panther.pms.hr.entity.EmployeeDocumentStatus.PENDING_REVIEW)
                .build();
        employee.getDocuments().add(0, document);
        employeeRepository.flush();
        return toResponse(document);
    }

    @Transactional
    public void deleteDocument(Long employeeId, Long documentId) {
        Employee employee = findOrThrow(employeeId);
        employee.getDocuments().removeIf(d -> d.getId().equals(documentId));
        employeeRepository.save(employee);
    }

    @Transactional
    public EmployeeDailyTaskResponse addDailyTask(Long employeeId, CreateEmployeeDailyTaskRequest request) {
        Employee employee = findOrThrow(employeeId);
        Property property = request.propertyId() != null
                ? propertyRepository.findById(request.propertyId())
                        .orElseThrow(() -> ResourceNotFoundException.of("Property", request.propertyId()))
                : null;

        EmployeeDailyTask task = EmployeeDailyTask.builder()
                .employee(employee)
                .title(request.title())
                .description(request.description())
                .assignedDate(LocalDate.now())
                .dueDate(request.dueDate())
                .priority(request.priority() != null ? request.priority() : com.panther.pms.hr.entity.TaskPriority.MEDIUM)
                .property(property)
                .roomNumber(request.roomNumber())
                .build();
        employee.getDailyTasks().add(0, task);
        employeeRepository.flush();
        auditService.log("Daily Task Assigned", "HR & Tasks", "Assigned task \"" + task.getTitle() + "\" to "
                + employee.getName(), ActivityType.INFO);
        return toResponse(task);
    }

    @Transactional
    public EmployeeDailyTaskResponse updateDailyTask(Long employeeId, Long taskId, UpdateEmployeeDailyTaskRequest request) {
        Employee employee = findOrThrow(employeeId);
        EmployeeDailyTask task = employee.getDailyTasks().stream()
                .filter(t -> t.getId().equals(taskId))
                .findFirst()
                .orElseThrow(() -> ResourceNotFoundException.of("EmployeeDailyTask", taskId));

        if (request.status() != null) {
            task.setStatus(request.status());
            if (request.status() == com.panther.pms.hr.entity.DailyTaskStatus.COMPLETED) {
                task.setCompletedDate(LocalDate.now());
            }
        }
        if (request.managerComment() != null) {
            task.setManagerComment(request.managerComment());
        }
        if (request.rating() != null) {
            task.setRating(request.rating());
        }

        employeeRepository.save(employee);
        return toResponse(task);
    }

    @Transactional
    public EmployeeDamageResponse addDamage(Long employeeId, CreateEmployeeDamageRequest request) {
        Employee employee = findOrThrow(employeeId);
        EmployeeDamage damage = EmployeeDamage.builder()
                .employee(employee)
                .incidentDate(request.incidentDate())
                .item(request.item())
                .propertyName(request.propertyName())
                .roomNumber(request.roomNumber())
                .description(request.description())
                .deductedFromSalary(request.deductedFromSalary())
                .photos(request.photos() != null ? new java.util.ArrayList<>(request.photos()) : new java.util.ArrayList<>())
                .build();
        if (request.estimatedCost() != null) {
            damage.setEstimatedCost(request.estimatedCost());
        }
        if (request.deductedAmount() != null) {
            damage.setDeductedAmount(request.deductedAmount());
        }
        employee.getDamages().add(0, damage);
        employeeRepository.flush();
        auditService.log("Staff Damage Recorded", "HR Incidents", "Logged damage incident for " + damage.getItem()
                + " ($" + damage.getEstimatedCost() + ")", ActivityType.WARNING);
        return toResponse(damage);
    }

    @Transactional
    public EmployeeLeaveResponse addLeave(Long employeeId, CreateEmployeeLeaveRequest request, String actorName) {
        Employee employee = findOrThrow(employeeId);
        LeaveStatus status = request.status() != null ? request.status() : LeaveStatus.PENDING;

        EmployeeLeave leave = EmployeeLeave.builder()
                .employee(employee)
                .leaveType(request.leaveType())
                .startDate(request.startDate())
                .endDate(request.endDate())
                .daysCount(request.daysCount())
                .reason(request.reason())
                .status(status)
                .requestedDate(LocalDate.now())
                .build();
        if (status == LeaveStatus.APPROVED) {
            leave.setApprovedByName(actorName);
        }
        employee.getLeaves().add(0, leave);

        syncEmployeeStatusFromLeaves(employee);
        employeeRepository.flush();
        auditService.log("Staff Leave Recorded", "HR Leaves", "Recorded " + leave.getLeaveType() + " ("
                + leave.getDaysCount() + " days) for " + employee.getName(), ActivityType.INFO);
        return toResponse(leave);
    }

    @Transactional
    public EmployeeLeaveResponse updateLeave(Long employeeId, Long leaveId, UpdateEmployeeLeaveRequest request, String actorName) {
        Employee employee = findOrThrow(employeeId);
        EmployeeLeave leave = employee.getLeaves().stream()
                .filter(l -> l.getId().equals(leaveId))
                .findFirst()
                .orElseThrow(() -> ResourceNotFoundException.of("EmployeeLeave", leaveId));

        leave.setStatus(request.status());
        if (request.status() == LeaveStatus.APPROVED) {
            leave.setApprovedByName(actorName);
        }

        syncEmployeeStatusFromLeaves(employee);
        employeeRepository.save(employee);
        return toResponse(leave);
    }

    /** Mirrors DataContext.tsx's addEmployeeLeave/updateEmployeeLeave status-sync exactly. */
    private void syncEmployeeStatusFromLeaves(Employee employee) {
        boolean hasActiveApprovedLeave = employee.getLeaves().stream()
                .anyMatch(l -> l.getStatus() == LeaveStatus.APPROVED);
        employee.setStatus(hasActiveApprovedLeave ? EmployeeStatus.ON_LEAVE : EmployeeStatus.ACTIVE);
    }

    private EmergencyContact toEmbeddable(EmergencyContactDto dto) {
        return dto != null ? new EmergencyContact(dto.name(), dto.phone(), dto.relationship()) : null;
    }

    private EmployeeResponse toResponse(Employee e) {
        EmergencyContactDto contact = e.getEmergencyContact() != null
                ? new EmergencyContactDto(e.getEmergencyContact().getName(), e.getEmergencyContact().getPhone(), e.getEmergencyContact().getRelationship())
                : null;

        List<EmployeeDocumentResponse> documents = e.getDocuments().stream().map(this::toResponse).toList();
        List<EmployeeDailyTaskResponse> tasks = e.getDailyTasks().stream().map(this::toResponse).toList();
        List<EmployeeDamageResponse> damages = e.getDamages().stream().map(this::toResponse).toList();
        List<EmployeeLeaveResponse> leaves = e.getLeaves().stream().map(this::toResponse).toList();

        return new EmployeeResponse(e.getId(), e.getName(), e.getAvatarUrl(), e.getPosition(), e.getDepartment(),
                e.getContact(), e.getEmail(), e.getEmploymentStatus(), e.getStatus(), e.getStatusReason(),
                e.getStartDate(), e.getBasicSalary(), e.getNationalId(), contact, e.getAddress(),
                documents, tasks, damages, leaves);
    }

    private EmployeeDocumentResponse toResponse(EmployeeDocument d) {
        return new EmployeeDocumentResponse(d.getId(), d.getName(), d.getType(), d.getFileUrl(), d.getUploadDate(),
                d.getSizeLabel(), d.getStatus());
    }

    private EmployeeDailyTaskResponse toResponse(EmployeeDailyTask t) {
        return new EmployeeDailyTaskResponse(t.getId(), t.getTitle(), t.getDescription(), t.getAssignedDate(),
                t.getDueDate(), t.getPriority(), t.getProperty() != null ? t.getProperty().getId() : null,
                t.getProperty() != null ? t.getProperty().getName() : null, t.getRoomNumber(), t.getStatus(),
                t.getCompletedDate(), t.getManagerComment(), t.getRating(), t.getRatedByName());
    }

    private EmployeeDamageResponse toResponse(EmployeeDamage d) {
        return new EmployeeDamageResponse(d.getId(), d.getIncidentDate(), d.getItem(), d.getPropertyName(),
                d.getRoomNumber(), d.getDescription(), d.getEstimatedCost(), d.isDeductedFromSalary(),
                d.getDeductedAmount(), d.getStatus(), List.copyOf(d.getPhotos()));
    }

    private EmployeeLeaveResponse toResponse(EmployeeLeave l) {
        return new EmployeeLeaveResponse(l.getId(), l.getLeaveType(), l.getStartDate(), l.getEndDate(),
                l.getDaysCount(), l.getReason(), l.getStatus(), l.getApprovedByName(), l.getRequestedDate());
    }

    private Employee findOrThrow(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Employee", id));
    }
}
