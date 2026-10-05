package com.panther.pms.leasing.service;

import com.panther.pms.common.PageResponse;
import com.panther.pms.common.audit.ActivityType;
import com.panther.pms.common.audit.AuditService;
import com.panther.pms.common.exception.BadRequestException;
import com.panther.pms.common.exception.ResourceNotFoundException;
import com.panther.pms.leasing.dto.BookingResponse;
import com.panther.pms.leasing.dto.BookingTimelineEventResponse;
import com.panther.pms.leasing.dto.CreateBookingRequest;
import com.panther.pms.leasing.entity.Agent;
import com.panther.pms.leasing.entity.Booking;
import com.panther.pms.leasing.entity.BookingStatus;
import com.panther.pms.leasing.entity.BookingTimelineEvent;
import com.panther.pms.leasing.entity.Client;
import com.panther.pms.leasing.entity.ClientStatus;
import com.panther.pms.leasing.repository.AgentRepository;
import com.panther.pms.leasing.repository.BookingRepository;
import com.panther.pms.leasing.repository.BookingSpecifications;
import com.panther.pms.leasing.repository.ClientRepository;
import com.panther.pms.property.entity.Property;
import com.panther.pms.property.entity.RentalType;
import com.panther.pms.property.entity.Room;
import com.panther.pms.property.entity.RoomStatus;
import com.panther.pms.property.repository.PropertyRepository;
import com.panther.pms.property.repository.RentalTypeRepository;
import com.panther.pms.property.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.Year;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final ClientRepository clientRepository;
    private final PropertyRepository propertyRepository;
    private final RoomRepository roomRepository;
    private final RentalTypeRepository rentalTypeRepository;
    private final AgentRepository agentRepository;
    private final AuditService auditService;

    public PageResponse<BookingResponse> list(BookingStatus status, Long propertyId, String search, Pageable pageable) {
        var page = bookingRepository.findAll(BookingSpecifications.filter(status, propertyId, search), pageable)
                .map(this::toResponse);
        return PageResponse.of(page);
    }

    public BookingResponse get(Long id) {
        return toResponse(findOrThrow(id));
    }

    public PageResponse<BookingResponse> listByClient(Long clientId, Pageable pageable) {
        return PageResponse.of(bookingRepository.findByClientId(clientId, pageable).map(this::toResponse));
    }

    @Transactional
    public BookingResponse create(CreateBookingRequest request, String actorName) {
        Client client = request.clientId() != null
                ? clientRepository.findById(request.clientId())
                        .orElseThrow(() -> ResourceNotFoundException.of("Client", request.clientId()))
                : null;
        Property property = propertyRepository.findById(request.propertyId())
                .orElseThrow(() -> ResourceNotFoundException.of("Property", request.propertyId()));
        Room room = request.roomId() != null
                ? roomRepository.findById(request.roomId())
                        .orElseThrow(() -> ResourceNotFoundException.of("Room", request.roomId()))
                : null;
        RentalType rentalType = rentalTypeRepository.findById(request.rentalTypeId())
                .orElseThrow(() -> ResourceNotFoundException.of("RentalType", request.rentalTypeId()));
        Agent agent = request.agentId() != null
                ? agentRepository.findById(request.agentId())
                        .orElseThrow(() -> ResourceNotFoundException.of("Agent", request.agentId()))
                : null;

        BookingStatus initialStatus = request.status() != null ? request.status() : BookingStatus.REQUESTED;
        Instant now = Instant.now();

        Booking booking = Booking.builder()
                .bookingNumber(generateUniqueBookingNumber())
                .client(client)
                .clientName(request.clientName())
                .clientEmail(request.clientEmail())
                .clientPhone(request.clientPhone())
                .property(property)
                .room(room)
                .rentalType(rentalType)
                .requestedDate(now)
                .moveInDate(request.moveInDate())
                .moveOutDate(request.moveOutDate())
                .monthlyRent(request.monthlyRent())
                .notes(request.notes())
                .source(request.source())
                .agent(agent)
                .status(initialStatus)
                .build();
        if (request.deposit() != null) {
            booking.setDeposit(request.deposit());
        }

        String eventActor = actorName != null ? actorName : request.clientName();
        booking.getTimeline().add(BookingTimelineEvent.builder()
                .booking(booking)
                .status(initialStatus)
                .occurredAt(now)
                .note("Booking request submitted")
                .updatedByName(eventActor)
                .build());

        booking = bookingRepository.save(booking);
        auditService.log("New Booking Request", "Bookings", eventActor + " requested booking for " + booking.getProperty().getName(), ActivityType.INFO);
        return toResponse(booking);
    }

    @Transactional
    public BookingResponse updateStatus(Long id, BookingStatus status, String note, String actorName) {
        Booking booking = findOrThrow(id);
        booking.setStatus(status);
        booking.getTimeline().add(BookingTimelineEvent.builder()
                .booking(booking)
                .status(status)
                .occurredAt(Instant.now())
                .note(note != null ? note : "Status updated to " + status.name())
                .updatedByName(actorName)
                .build());

        applyStatusSideEffects(booking, status);

        booking = bookingRepository.save(booking);
        auditService.log("Booking " + status, "Bookings", "Updated booking " + booking.getBookingNumber() + " status to " + status, ActivityType.INFO);
        return toResponse(booking);
    }

    @Transactional
    public BookingResponse assignRoom(Long id, Long roomId, String actorName) {
        Booking booking = findOrThrow(id);
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> ResourceNotFoundException.of("Room", roomId));
        if (!room.getProperty().getId().equals(booking.getProperty().getId())) {
            throw new BadRequestException("Room " + roomId + " does not belong to this booking's property.");
        }

        booking.setRoom(room);
        booking.setStatus(BookingStatus.ROOM_ASSIGNED);
        booking.getTimeline().add(BookingTimelineEvent.builder()
                .booking(booking)
                .status(BookingStatus.ROOM_ASSIGNED)
                .occurredAt(Instant.now())
                .note("Assigned room " + room.getRoomNumber() + " (" + room.getProperty().getName() + ")")
                .updatedByName(actorName)
                .build());

        room.setStatus(RoomStatus.RESERVED);
        roomRepository.save(room);

        booking = bookingRepository.save(booking);
        auditService.log("Room Assigned", "Rooms", "Assigned room " + room.getRoomNumber() + " to booking " + booking.getBookingNumber(), ActivityType.SUCCESS);
        return toResponse(booking);
    }

    /**
     * Server-enforced versions of the business rules narrated (but never actually wired up)
     * in the frontend mock's DataContext.tsx — see BACKEND_PLAN.md section 8.
     */
    private void applyStatusSideEffects(Booking booking, BookingStatus status) {
        if (status == BookingStatus.CHECKED_IN && booking.getRoom() != null) {
            booking.getRoom().setStatus(RoomStatus.OCCUPIED);
            roomRepository.save(booking.getRoom());

            if (booking.getClient() == null) {
                booking.setClient(resolveOrCreateClientForCheckIn(booking));
            }
            booking.getClient().setCurrentRoom(booking.getRoom());
            booking.getClient().setCurrentProperty(booking.getProperty());
            booking.getClient().setStatus(ClientStatus.ACTIVE);
            clientRepository.save(booking.getClient());
        } else if (status == BookingStatus.COMPLETED) {
            if (booking.getRoom() != null) {
                booking.getRoom().setStatus(RoomStatus.AVAILABLE);
                roomRepository.save(booking.getRoom());
            }
            if (booking.getClient() != null) {
                booking.getClient().setStatus(ClientStatus.FORMER);
                clientRepository.save(booking.getClient());
            }
        }
    }

    /**
     * A booking may reach CHECKED_IN with no linked {@link Client} — e.g. an anonymous public
     * inquiry, or a direct booking created via the "new guest" path in the operations UI, where
     * only the denormalized clientName/clientEmail/clientPhone snapshot exists on the booking
     * itself. Check-in is the moment this person becomes an actual resident, so from here on they
     * must exist as a real Client row — otherwise they'd never show up on the Clients Management
     * page. Reuses an existing client by email if one already exists (e.g. a repeat guest, or a
     * client account created separately after the inquiry was submitted) rather than creating a
     * duplicate.
     */
    private Client resolveOrCreateClientForCheckIn(Booking booking) {
        if (!StringUtils.hasText(booking.getClientEmail()) || !StringUtils.hasText(booking.getClientPhone())) {
            throw new BadRequestException(
                    "Cannot check in booking " + booking.getBookingNumber()
                            + ": a guest email and phone number are required to create the client record. "
                            + "Please update the booking with contact details before checking in.");
        }

        return clientRepository.findByEmailIgnoreCase(booking.getClientEmail())
                .map(existing -> {
                    auditService.log("Client Linked at Check-In", "Clients",
                            "Linked existing client " + existing.getName() + " to booking " + booking.getBookingNumber() + " during check-in",
                            ActivityType.INFO);
                    return existing;
                })
                .orElseGet(() -> {
                    Client created = clientRepository.save(Client.builder()
                            .name(booking.getClientName())
                            .email(booking.getClientEmail())
                            .phone(booking.getClientPhone())
                            .rentalType(booking.getRentalType().getName())
                            .moveInDate(booking.getMoveInDate())
                            .leaseExpiryDate(booking.getMoveOutDate())
                            .monthlyRent(booking.getMonthlyRent())
                            .depositPaid(booking.getDeposit() != null ? booking.getDeposit() : BigDecimal.ZERO)
                            .build());
                    auditService.log("Client Created at Check-In", "Clients",
                            "Auto-created client record for " + created.getName() + " during check-in of booking " + booking.getBookingNumber(),
                            ActivityType.SUCCESS);
                    return created;
                });
    }

    private String generateUniqueBookingNumber() {
        String year = String.valueOf(Year.now().getValue());
        String candidate;
        int attempt = (int) bookingRepository.count() + 1;
        do {
            candidate = "BK-" + year + "-" + String.format("%04d", attempt++);
        } while (bookingRepository.existsByBookingNumber(candidate));
        return candidate;
    }

    private BookingResponse toResponse(Booking b) {
        List<BookingTimelineEventResponse> timeline = b.getTimeline().stream()
                .map(e -> new BookingTimelineEventResponse(e.getStatus(), e.getOccurredAt(), e.getNote(), e.getUpdatedByName()))
                .toList();

        return new BookingResponse(
                b.getId(), b.getBookingNumber(),
                b.getClient() != null ? b.getClient().getId() : null,
                b.getClientName(), b.getClientEmail(), b.getClientPhone(),
                b.getProperty().getId(), b.getProperty().getName(),
                b.getRoom() != null ? b.getRoom().getId() : null,
                b.getRoom() != null ? b.getRoom().getRoomNumber() : null,
                b.getRentalType().getId(), b.getRentalType().getName().name(),
                b.getRequestedDate(), b.getMoveInDate(), b.getMoveOutDate(), b.getMonthlyRent(), b.getDeposit(),
                b.getStatus(), b.getNotes(), b.getSource(),
                b.getAgent() != null ? b.getAgent().getId() : null,
                b.getAgent() != null ? b.getAgent().getName() : null,
                timeline
        );
    }

    private Booking findOrThrow(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Booking", id));
    }
}
