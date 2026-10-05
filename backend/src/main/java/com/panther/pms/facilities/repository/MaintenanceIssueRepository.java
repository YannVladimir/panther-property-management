package com.panther.pms.facilities.repository;

import com.panther.pms.facilities.entity.IssueStatus;
import com.panther.pms.facilities.entity.MaintenanceIssue;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Collection;

public interface MaintenanceIssueRepository extends JpaRepository<MaintenanceIssue, Long>, JpaSpecificationExecutor<MaintenanceIssue> {

    boolean existsByTicketNumber(String ticketNumber);

    Page<MaintenanceIssue> findByClientId(Long clientId, Pageable pageable);

    long countByStatusNotIn(Collection<IssueStatus> statuses);

    long countByClientIdAndStatusNotIn(Long clientId, Collection<IssueStatus> statuses);
}
