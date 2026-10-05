package com.panther.pms.facilities.repository;

import com.panther.pms.facilities.entity.TechWorkOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;

public interface TechWorkOrderRepository extends JpaRepository<TechWorkOrder, Long> {

    boolean existsByJobNumber(String jobNumber);

    long countByTechnicianId(Long technicianId);

    @Query("select coalesce(sum(w.paidAmount), 0) from TechWorkOrder w where w.technician.id = :technicianId")
    BigDecimal sumPaidAmountByTechnician(@Param("technicianId") Long technicianId);
}
