package com.panther.pms.leasing.controller;

import com.panther.pms.common.PageResponse;
import com.panther.pms.leasing.dto.AgentDealResponse;
import com.panther.pms.leasing.dto.AgentResponse;
import com.panther.pms.leasing.dto.CreateAgentDealRequest;
import com.panther.pms.leasing.dto.CreateAgentRequest;
import com.panther.pms.leasing.dto.PayAgentCommissionRequest;
import com.panther.pms.leasing.dto.UpdateAgentRequest;
import com.panther.pms.leasing.service.AgentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/agents")
@RequiredArgsConstructor
@PreAuthorize("hasRole('OPERATIONS')")
public class AgentController {

    private final AgentService agentService;

    @GetMapping
    public PageResponse<AgentResponse> list(Pageable pageable) {
        return agentService.list(pageable);
    }

    @GetMapping("/{id}")
    public AgentResponse get(@PathVariable Long id) {
        return agentService.get(id);
    }

    @PostMapping
    public AgentResponse create(@Valid @RequestBody CreateAgentRequest request) {
        return agentService.create(request);
    }

    @PutMapping("/{id}")
    public AgentResponse update(@PathVariable Long id, @Valid @RequestBody UpdateAgentRequest request) {
        return agentService.update(id, request);
    }

    @PostMapping("/{id}/deals")
    public AgentDealResponse addDeal(@PathVariable Long id, @Valid @RequestBody CreateAgentDealRequest request) {
        return agentService.addDeal(id, request);
    }

    @PostMapping("/{id}/pay-commission")
    public ResponseEntity<Void> payCommission(@PathVariable Long id, @Valid @RequestBody PayAgentCommissionRequest request) {
        agentService.payCommission(id, request);
        return ResponseEntity.noContent().build();
    }
}
