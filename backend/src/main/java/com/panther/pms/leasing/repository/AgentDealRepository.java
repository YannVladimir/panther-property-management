package com.panther.pms.leasing.repository;

import com.panther.pms.leasing.entity.AgentDeal;
import com.panther.pms.leasing.entity.AgentDealStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface AgentDealRepository extends JpaRepository<AgentDeal, Long> {

    List<AgentDeal> findByAgentIdOrderByIdDesc(Long agentId);

    long countByAgentId(Long agentId);

    @Query("select coalesce(sum(d.commissionAmount), 0) from AgentDeal d where d.agent.id = :agentId")
    BigDecimal sumCommissionByAgent(@Param("agentId") Long agentId);

    @Query("select coalesce(sum(d.commissionAmount), 0) from AgentDeal d where d.agent.id = :agentId and d.status = :status")
    BigDecimal sumCommissionByAgentAndStatus(@Param("agentId") Long agentId, @Param("status") AgentDealStatus status);
}
