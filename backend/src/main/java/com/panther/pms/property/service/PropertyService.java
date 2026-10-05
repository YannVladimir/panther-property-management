package com.panther.pms.property.service;

import com.panther.pms.common.PageResponse;
import com.panther.pms.common.audit.ActivityType;
import com.panther.pms.common.audit.AuditService;
import com.panther.pms.common.exception.ConflictException;
import com.panther.pms.common.exception.ResourceNotFoundException;
import com.panther.pms.property.dto.CreatePropertyRequest;
import com.panther.pms.property.dto.PropertyResponse;
import com.panther.pms.property.dto.UpdatePropertyRequest;
import com.panther.pms.property.entity.Property;
import com.panther.pms.property.entity.PropertyStatus;
import com.panther.pms.property.entity.RoomStatus;
import com.panther.pms.property.repository.PropertyRepository;
import com.panther.pms.property.repository.PropertySpecifications;
import com.panther.pms.property.repository.RoomRepository;
import com.panther.pms.property.repository.RoomStatusCount;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PropertyService {

    private final PropertyRepository propertyRepository;
    private final RoomRepository roomRepository;
    private final AuditService auditService;

    public PageResponse<PropertyResponse> list(PropertyStatus status, String search, boolean publicView, Pageable pageable) {
        var page = propertyRepository.findAll(PropertySpecifications.filter(status, search, publicView), pageable)
                .map(this::toResponse);
        return PageResponse.of(page);
    }

    public PropertyResponse get(Long id, boolean publicView) {
        Property property = findOrThrow(id);
        if (publicView && property.getStatus() != PropertyStatus.ACTIVE) {
            // Don't leak the existence of non-published listings to anonymous visitors.
            throw ResourceNotFoundException.of("Property", id);
        }
        return toResponse(property);
    }

    @Transactional
    public PropertyResponse create(CreatePropertyRequest request) {
        Property.PropertyBuilder<?, ?> builder = Property.builder()
                .name(request.name())
                .code(generateUniqueCode(request.name()))
                .location(request.location())
                .neighborhood(request.neighborhood())
                .city(request.city())
                .address(request.address())
                .description(request.description())
                .featured(request.featured())
                .yearBuilt(request.yearBuilt())
                .status(request.status())
                .images(request.images() != null ? new java.util.ArrayList<>(request.images()) : new java.util.ArrayList<>())
                .amenities(request.amenities() != null ? new java.util.ArrayList<>(request.amenities()) : new java.util.ArrayList<>());

        if (request.rating() != null) {
            builder.rating(request.rating());
        }
        if (request.monthlyRevenueEstimate() != null) {
            builder.monthlyRevenueEstimate(request.monthlyRevenueEstimate());
        }

        Property property = builder.build();
        property = propertyRepository.save(property);
        auditService.log("Property Created", "Properties", "Created " + property.getName() + " (" + property.getCode() + ")", ActivityType.SUCCESS);
        return toResponse(property);
    }

    @Transactional
    public PropertyResponse update(Long id, UpdatePropertyRequest request) {
        Property property = findOrThrow(id);

        property.setName(request.name());
        property.setLocation(request.location());
        property.setNeighborhood(request.neighborhood());
        property.setCity(request.city());
        property.setAddress(request.address());
        property.setDescription(request.description());
        if (request.rating() != null) {
            property.setRating(request.rating());
        }
        if (request.reviewCount() != null) {
            property.setReviewCount(request.reviewCount());
        }
        property.setFeatured(request.featured());
        property.setYearBuilt(request.yearBuilt());
        if (request.monthlyRevenueEstimate() != null) {
            property.setMonthlyRevenueEstimate(request.monthlyRevenueEstimate());
        }
        property.setStatus(request.status());
        property.getImages().clear();
        if (request.images() != null) {
            property.getImages().addAll(request.images());
        }
        property.getAmenities().clear();
        if (request.amenities() != null) {
            property.getAmenities().addAll(request.amenities());
        }

        property = propertyRepository.save(property);
        auditService.log("Property Updated", "Properties", "Updated " + property.getName(), ActivityType.INFO);
        return toResponse(property);
    }

    @Transactional
    public void delete(Long id) {
        Property property = findOrThrow(id);
        if (roomRepository.countByPropertyId(id) > 0) {
            throw new ConflictException("Cannot delete a property that still has rooms. Remove its rooms first.");
        }
        auditService.log("Property Deleted", "Properties", "Deleted " + property.getName(), ActivityType.WARNING);
        propertyRepository.delete(property);
    }

    private String generateUniqueCode(String name) {
        String base = java.util.Arrays.stream(name.trim().split("\\s+"))
                .filter(w -> !w.isEmpty())
                .map(w -> w.substring(0, 1).toUpperCase())
                .reduce("", String::concat);
        if (base.isBlank()) {
            base = "PROP";
        }
        String candidate = base;
        int suffix = 1;
        while (propertyRepository.existsByCodeIgnoreCase(candidate)) {
            suffix++;
            candidate = base + "-" + suffix;
        }
        return candidate;
    }

    private PropertyResponse toResponse(Property p) {
        Map<RoomStatus, Long> counts = new EnumMap<>(RoomStatus.class);
        for (RoomStatusCount rsc : roomRepository.countGroupedByStatusForProperty(p.getId())) {
            counts.put(rsc.getStatus(), rsc.getCount());
        }
        int available = counts.getOrDefault(RoomStatus.AVAILABLE, 0L).intValue();
        int occupied = counts.getOrDefault(RoomStatus.OCCUPIED, 0L).intValue();
        int reserved = counts.getOrDefault(RoomStatus.RESERVED, 0L).intValue();
        int maintenance = counts.getOrDefault(RoomStatus.MAINTENANCE, 0L).intValue();

        return new PropertyResponse(
                p.getId(), p.getName(), p.getCode(), p.getLocation(), p.getNeighborhood(), p.getCity(),
                p.getAddress(), List.copyOf(p.getImages()), List.copyOf(p.getAmenities()), p.getDescription(),
                p.getRating(), p.getReviewCount(), p.isFeatured(), p.getYearBuilt(), p.getMonthlyRevenueEstimate(),
                p.getStatus(), available + occupied + reserved + maintenance, occupied, available, reserved, maintenance
        );
    }

    private Property findOrThrow(Long id) {
        return propertyRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Property", id));
    }
}
