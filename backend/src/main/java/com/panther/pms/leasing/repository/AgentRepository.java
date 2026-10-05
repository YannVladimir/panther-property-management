package com.panther.pms.leasing.repository;

import com.panther.pms.leasing.entity.Agent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface AgentRepository extends JpaRepository<Agent, Long>, JpaSpecificationExecutor<Agent> {

    boolean existsByEmailIgnoreCase(String email);
}
