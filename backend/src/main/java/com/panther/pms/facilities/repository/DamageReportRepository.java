package com.panther.pms.facilities.repository;

import com.panther.pms.facilities.entity.DamageReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface DamageReportRepository extends JpaRepository<DamageReport, Long>, JpaSpecificationExecutor<DamageReport> {
}
