package com.panther.pms.leasing.service;

import com.panther.pms.common.PageResponse;
import com.panther.pms.common.audit.ActivityType;
import com.panther.pms.common.audit.AuditService;
import com.panther.pms.common.exception.ConflictException;
import com.panther.pms.common.exception.ResourceNotFoundException;
import com.panther.pms.iam.service.SystemSettingsService;
import com.panther.pms.leasing.dto.AgentDealResponse;
import com.panther.pms.leasing.dto.AgentResponse;
import com.panther.pms.leasing.dto.CreateAgentDealRequest;
import com.panther.pms.leasing.dto.CreateAgentRequest;
import com.panther.pms.leasing.dto.PayAgentCommissionRequest;
import com.panther.pms.leasing.dto.UpdateAgentRequest;
import com.panther.pms.leasing.entity.Agent;
import com.panther.pms.leasing.entity.AgentDeal;
import com.panther.pms.leasing.entity.AgentDealStatus;
import com.panther.pms.leasing.repository.AgentDealRepository;
import com.panther.pms.leasing.repository.AgentRepository;
import com.panther.pms.leasing.repository.BookingRepository;
import com.panther.pms.property.entity.Property;
import com.panther.pms.property.entity.Room;
import com.panther.pms.property.repository.PropertyRepository;
import com.panther.pms.property.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AgentService {

    private final AgentRepository agentRepository;
    private final AgentDealRepository agentDealRepository;
    private final BookingRepository bookingRepository;
    private final PropertyRepository propertyRepository;
    private final RoomRepository roomRepository;
    private final SystemSettingsService systemSettingsService;
    private final AuditService auditService;

    public PageResponse<AgentResponse> list(Pageable pageable) {
        Page<Agent> page = agentRepository.findAll(pageable);
        return PageResponse.of(page.map(this::toResponse));
    }

    public AgentResponse get(Long id) {
        return toResponse(findOrThrow(id));
    }

    @Transactional
    public AgentResponse create(CreateAgentRequest request) {
        if (agentRepository.existsByEmailIgnoreCase(request.email())) {
            throw new ConflictException("A broker with this email already exists.");
        }

        BigDecimal commissionRate = request.commissionRatePercent() != null
                ? request.commissionRatePercent()
                : systemSettingsService.get().defaultAgentCommissionPct();

        Agent agent = Agent.builder()
                .name(request.name())
                .agency(request.agency())
                .phone(request.phone())
                .email(request.email())
                .commissionRatePercent(commissionRate)
                .paymentMethod(request.paymentMethod())
                .payoutAccount(request.payoutAccount())
                .notes(request.notes())
                .build();

        agent = agentRepository.save(agent);
        auditService.log("Broker Registered", "Agents", "Registered partner broker " + agent.getName()
                + " (" + (agent.getAgency() != null ? agent.getAgency() : "Independent") + ")", ActivityType.SUCCESS);
        return toResponse(agent);
    }

    @Transactional
    public AgentResponse update(Long id, UpdateAgentRequest request) {
        Agent agent = findOrThrow(id);

        if (!agent.getEmail().equalsIgnoreCase(request.email())
                && agentRepository.existsByEmailIgnoreCase(request.email())) {
            throw new ConflictException("A broker with this email already exists.");
        }

        agent.setName(request.name());
        agent.setAgency(request.agency());
        agent.setPhone(request.phone());
        agent.setEmail(request.email());
        agent.setCommissionRatePercent(request.commissionRatePercent());
        agent.setStatus(request.status());
        agent.setPaymentMethod(request.paymentMethod());
        agent.setPayoutAccount(request.payoutAccount());
        agent.setNotes(request.notes());

        agent = agentRepository.save(agent);
        auditService.log("Broker Profile Updated", "Agents", "Updated details for broker " + agent.getName(), ActivityType.INFO);
        return toResponse(agent);
    }

    @Transactional
    public AgentDealResponse addDeal(Long agentId, CreateAgentDealRequest request) {
        Agent agent = findOrThrow(agentId);
        Property property = propertyRepository.findById(request.propertyId())
                .orElseThrow(() -> ResourceNotFoundException.of("Property", request.propertyId()));
        Room room = request.roomId() != null
                ? roomRepository.findById(request.roomId())
                        .orElseThrow(() -> ResourceNotFoundException.of("Room", request.roomId()))
                : null;

        BigDecimal commissionPct = request.commissionPercentage() != null
                ? request.commissionPercentage()
                : agent.getCommissionRatePercent();
        BigDecimal commissionAmount = request.monthlyRent()
                .multiply(commissionPct)
                .divide(BigDecimal.valueOf(100));

        AgentDeal deal = AgentDeal.builder()
                .agent(agent)
                .clientName(request.clientName())
                .clientEmail(request.clientEmail())
                .clientPhone(request.clientPhone())
                .property(property)
                .room(room)
                .rentalType(request.rentalType())
                .monthlyRent(request.monthlyRent())
                .commissionPercentage(commissionPct)
                .commissionAmount(commissionAmount)
                .notes(request.notes())
                .build();

        agent.getDeals().add(0, deal);
        // `agent` is already managed in this transaction, so save() would merge() rather than
        // persist() — merging a transient child returns a *new* instance and never sets the id
        // on `deal`. flush() instead, which cascade-persists the existing managed graph in place.
        agentRepository.flush();

        auditService.log("Agent Commission Logged", "Agents", "Recorded $" + deal.getCommissionAmount()
                + " commission deal for tenant " + deal.getClientName(), ActivityType.SUCCESS);
        return toResponse(deal);
    }

    @Transactional
    public void payCommission(Long agentId, PayAgentCommissionRequest request) {
        Agent agent = findOrThrow(agentId);
        List<AgentDeal> deals = request.dealIds() != null && !request.dealIds().isEmpty()
                ? agent.getDeals().stream().filter(d -> request.dealIds().contains(d.getId())).toList()
                : agent.getDeals().stream().filter(d -> d.getStatus() != AgentDealStatus.PAID).toList();

        for (AgentDeal deal : deals) {
            deal.setStatus(AgentDealStatus.PAID);
            deal.setPayoutDate(LocalDate.now());
            deal.setPayoutReference(request.reference());
        }
        agentRepository.save(agent);
        auditService.log("Commission Disbursed", "Agents", "Disbursed $" + request.amount() + " commission payout via "
                + request.paymentMethod() + " (Ref: " + request.reference() + ")", ActivityType.SUCCESS);
    }

    private AgentResponse toResponse(Agent a) {
        long dealsCount = agentDealRepository.countByAgentId(a.getId());
        long bookingsCount = bookingRepository.countByAgentId(a.getId());
        BigDecimal totalEarned = agentDealRepository.sumCommissionByAgent(a.getId());
        BigDecimal paid = agentDealRepository.sumCommissionByAgentAndStatus(a.getId(), AgentDealStatus.PAID);
        BigDecimal outstanding = totalEarned.subtract(paid);

        List<AgentDealResponse> deals = a.getDeals().stream().map(this::toResponse).toList();

        return new AgentResponse(
                a.getId(), a.getName(), a.getAgency(), a.getPhone(), a.getEmail(), a.getAvatarUrl(), a.getStatus(),
                (int) dealsCount, (int) bookingsCount, (int) dealsCount,
                a.getCommissionRatePercent(), totalEarned, paid, outstanding,
                a.getPaymentMethod(), a.getPayoutAccount(), a.getNotes(), deals
        );
    }

    private AgentDealResponse toResponse(AgentDeal d) {
        return new AgentDealResponse(d.getId(), d.getClientName(), d.getClientEmail(), d.getClientPhone(),
                d.getProperty().getId(), d.getProperty().getName(),
                d.getRoom() != null ? d.getRoom().getId() : null,
                d.getRoom() != null ? d.getRoom().getRoomNumber() : null,
                d.getRentalType(), d.getMonthlyRent(), d.getCommissionPercentage(), d.getCommissionAmount(),
                d.getDealDate(), d.getStatus(), d.getPayoutDate(), d.getPayoutReference(), d.getNotes());
    }

    private Agent findOrThrow(Long id) {
        return agentRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Agent", id));
    }
}
