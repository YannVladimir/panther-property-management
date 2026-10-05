package com.panther.pms.finance.repository;

import com.panther.pms.finance.entity.RecurringBill;
import com.panther.pms.finance.entity.RecurringBillStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface RecurringBillRepository extends JpaRepository<RecurringBill, Long>, JpaSpecificationExecutor<RecurringBill> {

    long countByStatus(RecurringBillStatus status);
}
