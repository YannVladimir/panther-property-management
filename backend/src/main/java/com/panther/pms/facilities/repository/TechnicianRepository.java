package com.panther.pms.facilities.repository;

import com.panther.pms.facilities.entity.Technician;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface TechnicianRepository extends JpaRepository<Technician, Long>, JpaSpecificationExecutor<Technician> {
}
