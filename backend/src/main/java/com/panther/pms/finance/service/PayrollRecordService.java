package com.panther.pms.finance.service;

import com.panther.pms.common.PageResponse;
import com.panther.pms.common.audit.ActivityType;
import com.panther.pms.common.audit.AuditService;
import com.panther.pms.common.exception.ResourceNotFoundException;
import com.panther.pms.finance.dto.CreatePayrollRecordRequest;
import com.panther.pms.finance.dto.PayrollRecordResponse;
import com.panther.pms.finance.entity.PayrollRecord;
import com.panther.pms.finance.repository.PayrollRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class PayrollRecordService {

    private final PayrollRecordRepository payrollRecordRepository;
    private final AuditService auditService;

    public PageResponse<PayrollRecordResponse> list(Pageable pageable) {
        Page<PayrollRecord> page = payrollRecordRepository.findAll(pageable);
        return PageResponse.of(page.map(this::toResponse));
    }

    public PayrollRecordResponse get(Long id) {
        return toResponse(findOrThrow(id));
    }

    public PageResponse<PayrollRecordResponse> listByEmployee(Long employeeId, Pageable pageable) {
        return PageResponse.of(payrollRecordRepository.findByEmployeeId(employeeId, pageable).map(this::toResponse));
    }

    @Transactional
    public PayrollRecordResponse create(CreatePayrollRecordRequest request) {
        BigDecimal allowances = request.allowances() != null ? request.allowances() : BigDecimal.ZERO;
        BigDecimal bonuses = request.bonuses() != null ? request.bonuses() : BigDecimal.ZERO;
        BigDecimal deductions = request.deductions() != null ? request.deductions() : BigDecimal.ZERO;
        BigDecimal taxAmount = request.taxAmount() != null ? request.taxAmount() : BigDecimal.ZERO;

        // Computed server-side rather than trusted from client input (BACKEND_PLAN.md section 8).
        BigDecimal netSalary = request.basicSalary()
                .add(allowances)
                .add(bonuses)
                .subtract(deductions)
                .subtract(taxAmount);

        PayrollRecord record = PayrollRecord.builder()
                .payrollNumber(generateUniquePayrollNumber())
                .employeeId(request.employeeId())
                .employeeName(request.employeeName())
                .position(request.position())
                .department(request.department())
                .period(request.period())
                .basicSalary(request.basicSalary())
                .allowances(allowances)
                .bonuses(bonuses)
                .deductions(deductions)
                .taxAmount(taxAmount)
                .netSalary(netSalary)
                .paymentDate(request.paymentDate())
                .paymentStatus(request.paymentStatus())
                .paymentMethod(request.paymentMethod())
                .build();

        record = payrollRecordRepository.save(record);
        auditService.log("Payroll Generated", "HR & Payroll", "Generated payroll slip " + record.getPayrollNumber()
                + " for " + record.getEmployeeName() + " ($" + record.getNetSalary() + ")", ActivityType.SUCCESS);
        return toResponse(record);
    }

    private String generateUniquePayrollNumber() {
        String yearMonth = YearMonth.now().format(DateTimeFormatter.ofPattern("yyyy-MM", Locale.ENGLISH));
        String candidate;
        int attempt = (int) payrollRecordRepository.count() + 1;
        do {
            candidate = "PAY-" + yearMonth + "-" + String.format("%03d", attempt++);
        } while (payrollRecordRepository.existsByPayrollNumber(candidate));
        return candidate;
    }

    private PayrollRecordResponse toResponse(PayrollRecord r) {
        return new PayrollRecordResponse(r.getId(), r.getPayrollNumber(), r.getEmployeeId(), r.getEmployeeName(),
                r.getPosition(), r.getDepartment(), r.getPeriod(), r.getBasicSalary(), r.getAllowances(),
                r.getBonuses(), r.getDeductions(), r.getTaxAmount(), r.getNetSalary(), r.getPaymentDate(),
                r.getPaymentStatus(), r.getPaymentMethod());
    }

    private PayrollRecord findOrThrow(Long id) {
        return payrollRecordRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("PayrollRecord", id));
    }
}
