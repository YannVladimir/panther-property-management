package com.panther.pms.property.service;

import com.panther.pms.common.exception.ConflictException;
import com.panther.pms.common.exception.ResourceNotFoundException;
import com.panther.pms.property.dto.BuildingResponse;
import com.panther.pms.property.dto.CreateBuildingRequest;
import com.panther.pms.property.dto.UpdateBuildingRequest;
import com.panther.pms.property.entity.Building;
import com.panther.pms.property.entity.Property;
import com.panther.pms.property.repository.BuildingRepository;
import com.panther.pms.property.repository.PropertyRepository;
import com.panther.pms.property.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BuildingService {

    private final BuildingRepository buildingRepository;
    private final PropertyRepository propertyRepository;
    private final RoomRepository roomRepository;

    public List<BuildingResponse> listByProperty(Long propertyId) {
        List<Building> buildings = propertyId != null
                ? buildingRepository.findByPropertyId(propertyId)
                : buildingRepository.findAll();
        return buildings.stream().map(this::toResponse).toList();
    }

    public BuildingResponse get(Long id) {
        return toResponse(findOrThrow(id));
    }

    @Transactional
    public BuildingResponse create(CreateBuildingRequest request) {
        Property property = propertyRepository.findById(request.propertyId())
                .orElseThrow(() -> ResourceNotFoundException.of("Property", request.propertyId()));

        Building building = Building.builder()
                .property(property)
                .name(request.name())
                .floorsCount(request.floorsCount())
                .build();

        return toResponse(buildingRepository.save(building));
    }

    @Transactional
    public BuildingResponse update(Long id, UpdateBuildingRequest request) {
        Building building = findOrThrow(id);
        building.setName(request.name());
        building.setFloorsCount(request.floorsCount());
        return toResponse(buildingRepository.save(building));
    }

    @Transactional
    public void delete(Long id) {
        Building building = findOrThrow(id);
        if (roomRepository.countByBuildingId(id) > 0) {
            throw new ConflictException("Cannot delete a building that still has rooms. Remove its rooms first.");
        }
        buildingRepository.delete(building);
    }

    private BuildingResponse toResponse(Building b) {
        int totalRooms = (int) roomRepository.countByBuildingId(b.getId());
        return new BuildingResponse(b.getId(), b.getProperty().getId(), b.getProperty().getName(),
                b.getName(), b.getFloorsCount(), totalRooms);
    }

    private Building findOrThrow(Long id) {
        return buildingRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Building", id));
    }
}
