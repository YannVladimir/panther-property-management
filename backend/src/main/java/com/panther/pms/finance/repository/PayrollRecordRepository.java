package com.panther.pms.finance.repository;

import com.panther.pms.finance.entity.PayrollRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PayrollRecordRepository extends JpaRepository<PayrollRecord, Long> {

    boolean existsByPayrollNumber(String payrollNumber);

    Page<PayrollRecord> findByEmployeeId(Long employeeId, Pageable pageable);
}
