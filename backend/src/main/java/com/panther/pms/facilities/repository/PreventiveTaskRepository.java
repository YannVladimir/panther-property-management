package com.panther.pms.facilities.repository;

import com.panther.pms.facilities.entity.PreventiveTask;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface PreventiveTaskRepository extends JpaRepository<PreventiveTask, Long>, JpaSpecificationExecutor<PreventiveTask> {

    Page<PreventiveTask> findByAssignedStaffId(Long assignedStaffId, Pageable pageable);
}
