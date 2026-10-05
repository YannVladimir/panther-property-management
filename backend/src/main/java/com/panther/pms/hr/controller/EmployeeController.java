package com.panther.pms.hr.controller;

import com.panther.pms.common.PageResponse;
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
import com.panther.pms.hr.dto.UpdateEmployeeStatusRequest;
import com.panther.pms.hr.entity.Department;
import com.panther.pms.hr.entity.EmployeeStatus;
import com.panther.pms.hr.service.EmployeeService;
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

import java.util.List;

@RestController
@RequestMapping("/api/v1/employees")
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeService employeeService;

    @GetMapping
    @PreAuthorize("hasRole('OPERATIONS')")
    public PageResponse<EmployeeResponse> list(@RequestParam(required = false) Department department,
                                                @RequestParam(required = false) EmployeeStatus status,
                                                @RequestParam(required = false) String search,
                                                Pageable pageable) {
        return employeeService.list(department, status, search, pageable);
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('HOUSEHOLD')")
    public EmployeeResponse me(@AuthenticationPrincipal UserPrincipal principal) {
        return employeeService.get(principal.getEmployeeId());
    }

    @GetMapping("/me/daily-tasks")
    @PreAuthorize("hasRole('HOUSEHOLD')")
    public List<EmployeeDailyTaskResponse> myTasks(@AuthenticationPrincipal UserPrincipal principal) {
        return employeeService.get(principal.getEmployeeId()).dailyTasks();
    }

    /** Completed task history (HouseholdTaskHistoryPage). */
    @GetMapping("/me/history")
    @PreAuthorize("hasRole('HOUSEHOLD')")
    public List<EmployeeDailyTaskResponse> myHistory(@AuthenticationPrincipal UserPrincipal principal) {
        return employeeService.get(principal.getEmployeeId()).dailyTasks().stream()
                .filter(t -> t.status() == com.panther.pms.hr.entity.DailyTaskStatus.COMPLETED)
                .toList();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('OPERATIONS') or (hasRole('HOUSEHOLD') and principal.employeeId == #id)")
    public EmployeeResponse get(@PathVariable Long id) {
        return employeeService.get(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('OPERATIONS')")
    public EmployeeResponse create(@Valid @RequestBody CreateEmployeeRequest request) {
        return employeeService.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('OPERATIONS')")
    public EmployeeResponse update(@PathVariable Long id, @Valid @RequestBody UpdateEmployeeRequest request) {
        return employeeService.update(id, request);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('OPERATIONS')")
    public EmployeeResponse updateStatus(@PathVariable Long id, @Valid @RequestBody UpdateEmployeeStatusRequest request) {
        return employeeService.updateStatus(id, request.status(), request.reason());
    }

    @PostMapping("/{id}/documents")
    @PreAuthorize("hasRole('OPERATIONS')")
    public EmployeeDocumentResponse addDocument(@PathVariable Long id, @Valid @RequestBody CreateEmployeeDocumentRequest request) {
        return employeeService.addDocument(id, request);
    }

    @DeleteMapping("/{id}/documents/{documentId}")
    @PreAuthorize("hasRole('OPERATIONS')")
    public ResponseEntity<Void> deleteDocument(@PathVariable Long id, @PathVariable Long documentId) {
        employeeService.deleteDocument(id, documentId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/daily-tasks")
    @PreAuthorize("hasRole('OPERATIONS')")
    public EmployeeDailyTaskResponse addDailyTask(@PathVariable Long id, @Valid @RequestBody CreateEmployeeDailyTaskRequest request) {
        return employeeService.addDailyTask(id, request);
    }

    @PatchMapping("/{id}/daily-tasks/{taskId}")
    @PreAuthorize("hasRole('OPERATIONS') or (hasRole('HOUSEHOLD') and principal.employeeId == #id)")
    public EmployeeDailyTaskResponse updateDailyTask(@PathVariable Long id, @PathVariable Long taskId,
                                                      @Valid @RequestBody UpdateEmployeeDailyTaskRequest request) {
        return employeeService.updateDailyTask(id, taskId, request);
    }

    @PostMapping("/{id}/damages")
    @PreAuthorize("hasRole('OPERATIONS')")
    public EmployeeDamageResponse addDamage(@PathVariable Long id, @Valid @RequestBody CreateEmployeeDamageRequest request) {
        return employeeService.addDamage(id, request);
    }

    @PostMapping("/{id}/leaves")
    @PreAuthorize("hasRole('OPERATIONS') or (hasRole('HOUSEHOLD') and principal.employeeId == #id)")
    public EmployeeLeaveResponse addLeave(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id,
                                           @Valid @RequestBody CreateEmployeeLeaveRequest request) {
        return employeeService.addLeave(id, request, principal.getName());
    }

    @PatchMapping("/{id}/leaves/{leaveId}")
    @PreAuthorize("hasRole('OPERATIONS')")
    public EmployeeLeaveResponse updateLeave(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id,
                                              @PathVariable Long leaveId, @Valid @RequestBody UpdateEmployeeLeaveRequest request) {
        return employeeService.updateLeave(id, leaveId, request, principal.getName());
    }
}
