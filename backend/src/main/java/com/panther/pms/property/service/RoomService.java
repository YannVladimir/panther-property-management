package com.panther.pms.property.service;

import com.panther.pms.common.PageResponse;
import com.panther.pms.common.audit.ActivityType;
import com.panther.pms.common.audit.AuditService;
import com.panther.pms.common.exception.ResourceNotFoundException;
import com.panther.pms.property.dto.CreateRoomRequest;
import com.panther.pms.property.dto.RoomResponse;
import com.panther.pms.property.dto.UpdateRoomRequest;
import com.panther.pms.property.entity.Building;
import com.panther.pms.property.entity.FurnishingType;
import com.panther.pms.property.entity.Property;
import com.panther.pms.property.entity.Room;
import com.panther.pms.property.entity.RoomStatus;
import com.panther.pms.property.repository.BuildingRepository;
import com.panther.pms.property.repository.PropertyRepository;
import com.panther.pms.property.repository.RoomRepository;
import com.panther.pms.property.repository.RoomSpecifications;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository roomRepository;
    private final PropertyRepository propertyRepository;
    private final AuditService auditService;
    private final BuildingRepository buildingRepository;

    public PageResponse<RoomResponse> list(Long propertyId, RoomStatus status, FurnishingType furnishingType,
                                            BigDecimal minPrice, BigDecimal maxPrice, String search, Pageable pageable) {
        var page = roomRepository
                .findAll(RoomSpecifications.filter(propertyId, status, furnishingType, minPrice, maxPrice, search), pageable)
                .map(this::toResponse);
        return PageResponse.of(page);
    }

    public RoomResponse get(Long id) {
        return toResponse(findOrThrow(id));
    }

    @Transactional
    public RoomResponse create(CreateRoomRequest request) {
        Property property = propertyRepository.findById(request.propertyId())
                .orElseThrow(() -> ResourceNotFoundException.of("Property", request.propertyId()));
        Building building = resolveBuilding(request.buildingId(), property);

        Room room = Room.builder()
                .property(property)
                .building(building)
                .roomNumber(request.roomNumber())
                .floor(request.floor())
                .sizeSqM(request.sizeSqM())
                .bedrooms(request.bedrooms())
                .bathrooms(request.bathrooms())
                .furnishingType(request.furnishingType())
                .monthlyRent(request.monthlyRent())
                .status(request.status() != null ? request.status() : RoomStatus.AVAILABLE)
                .virtualTourUrl(request.virtualTourUrl())
                .description(request.description())
                .amenities(request.amenities() != null ? new java.util.ArrayList<>(request.amenities()) : new java.util.ArrayList<>())
                .utilitiesIncluded(request.utilitiesIncluded() != null ? new java.util.ArrayList<>(request.utilitiesIncluded()) : new java.util.ArrayList<>())
                .rules(request.rules() != null ? new java.util.ArrayList<>(request.rules()) : new java.util.ArrayList<>())
                .images(request.images() != null ? new java.util.ArrayList<>(request.images()) : new java.util.ArrayList<>())
                .build();

        if (request.deposit() != null) {
            room.setDeposit(request.deposit());
        }

        return toResponse(roomRepository.save(room));
    }

    @Transactional
    public RoomResponse update(Long id, UpdateRoomRequest request) {
        Room room = findOrThrow(id);
        room.setBuilding(resolveBuilding(request.buildingId(), room.getProperty()));
        room.setRoomNumber(request.roomNumber());
        room.setFloor(request.floor());
        room.setSizeSqM(request.sizeSqM());
        room.setBedrooms(request.bedrooms());
        room.setBathrooms(request.bathrooms());
        room.setFurnishingType(request.furnishingType());
        room.setMonthlyRent(request.monthlyRent());
        if (request.deposit() != null) {
            room.setDeposit(request.deposit());
        }
        room.setVirtualTourUrl(request.virtualTourUrl());
        room.setDescription(request.description());

        replaceAll(room.getAmenities(), request.amenities());
        replaceAll(room.getUtilitiesIncluded(), request.utilitiesIncluded());
        replaceAll(room.getRules(), request.rules());
        replaceAll(room.getImages(), request.images());

        return toResponse(roomRepository.save(room));
    }

    @Transactional
    public RoomResponse updateStatus(Long id, RoomStatus status) {
        Room room = findOrThrow(id);
        room.setStatus(status);
        room = roomRepository.save(room);
        auditService.log("Room Status Changed", "Rooms", "Room " + room.getRoomNumber() + " set to " + status, ActivityType.INFO);
        return toResponse(room);
    }

    @Transactional
    public void delete(Long id) {
        Room room = findOrThrow(id);
        roomRepository.delete(room);
    }

    private Building resolveBuilding(Long buildingId, Property property) {
        if (buildingId == null) {
            return null;
        }
        Building building = buildingRepository.findById(buildingId)
                .orElseThrow(() -> ResourceNotFoundException.of("Building", buildingId));
        if (!building.getProperty().getId().equals(property.getId())) {
            throw new com.panther.pms.common.exception.BadRequestException(
                    "Building " + buildingId + " does not belong to property " + property.getId() + ".");
        }
        return building;
    }

    private void replaceAll(List<String> target, List<String> replacement) {
        target.clear();
        if (replacement != null) {
            target.addAll(replacement);
        }
    }

    private RoomResponse toResponse(Room r) {
        return new RoomResponse(
                r.getId(), r.getProperty().getId(), r.getProperty().getName(),
                r.getBuilding() != null ? r.getBuilding().getId() : null,
                r.getBuilding() != null ? r.getBuilding().getName() : null,
                r.getRoomNumber(), r.getFloor(), r.getSizeSqM(), r.getBedrooms(), r.getBathrooms(),
                r.getFurnishingType(), r.getMonthlyRent(), r.getDeposit(), r.getStatus(),
                List.copyOf(r.getAmenities()), List.copyOf(r.getUtilitiesIncluded()),
                List.copyOf(r.getRules()), List.copyOf(r.getImages()),
                r.getCurrentClientId(), r.getVirtualTourUrl(), r.getDescription()
        );
    }

    private Room findOrThrow(Long id) {
        return roomRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Room", id));
    }
}
