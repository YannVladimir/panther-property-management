package com.panther.pms.property.service;

import com.panther.pms.common.exception.ConflictException;
import com.panther.pms.common.exception.ResourceNotFoundException;
import com.panther.pms.property.dto.CreateRentalTypeRequest;
import com.panther.pms.property.dto.IncludedMaterialItemRequest;
import com.panther.pms.property.dto.IncludedMaterialItemResponse;
import com.panther.pms.property.dto.RentalTypeResponse;
import com.panther.pms.property.dto.UpdateRentalTypeRequest;
import com.panther.pms.property.entity.Property;
import com.panther.pms.property.entity.RentalType;
import com.panther.pms.property.entity.RentalTypeIncludedMaterial;
import com.panther.pms.property.repository.PropertyRepository;
import com.panther.pms.property.repository.RentalTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class RentalTypeService {

    private final RentalTypeRepository rentalTypeRepository;
    private final PropertyRepository propertyRepository;

    public List<RentalTypeResponse> list() {
        return rentalTypeRepository.findAll().stream().map(this::toResponse).toList();
    }

    public RentalTypeResponse get(Long id) {
        return toResponse(findOrThrow(id));
    }

    @Transactional
    public RentalTypeResponse create(CreateRentalTypeRequest request) {
        if (rentalTypeRepository.existsByName(request.name())) {
            throw new ConflictException("A rental type for " + request.name() + " already exists.");
        }

        RentalType rentalType = RentalType.builder()
                .name(request.name())
                .description(request.description())
                .priceMultiplier(request.priceMultiplier())
                .status(request.status())
                .build();

        applyIncludedMaterials(rentalType, request.includedMaterials());
        applyApplicableProperties(rentalType, request.applicablePropertyIds());

        return toResponse(rentalTypeRepository.save(rentalType));
    }

    @Transactional
    public RentalTypeResponse update(Long id, UpdateRentalTypeRequest request) {
        RentalType rentalType = findOrThrow(id);
        rentalType.setDescription(request.description());
        rentalType.setPriceMultiplier(request.priceMultiplier());
        rentalType.setStatus(request.status());

        applyIncludedMaterials(rentalType, request.includedMaterials());
        applyApplicableProperties(rentalType, request.applicablePropertyIds());

        return toResponse(rentalTypeRepository.save(rentalType));
    }

    @Transactional
    public void delete(Long id) {
        rentalTypeRepository.delete(findOrThrow(id));
    }

    private void applyIncludedMaterials(RentalType rentalType, List<IncludedMaterialItemRequest> items) {
        rentalType.getIncludedMaterials().clear();
        if (items == null) {
            return;
        }
        for (IncludedMaterialItemRequest item : items) {
            rentalType.getIncludedMaterials().add(RentalTypeIncludedMaterial.builder()
                    .rentalType(rentalType)
                    .name(item.name())
                    .quantity(item.quantity())
                    .condition(item.condition())
                    .category(item.category())
                    .build());
        }
    }

    private void applyApplicableProperties(RentalType rentalType, List<Long> propertyIds) {
        Set<Property> properties = new HashSet<>();
        if (propertyIds != null) {
            for (Long propertyId : propertyIds) {
                properties.add(propertyRepository.findById(propertyId)
                        .orElseThrow(() -> ResourceNotFoundException.of("Property", propertyId)));
            }
        }
        rentalType.setApplicableProperties(properties);
    }

    private RentalTypeResponse toResponse(RentalType rt) {
        List<IncludedMaterialItemResponse> materials = rt.getIncludedMaterials().stream()
                .map(m -> new IncludedMaterialItemResponse(m.getId(), m.getName(), m.getQuantity(), m.getCondition(), m.getCategory()))
                .toList();
        List<Long> propertyIds = rt.getApplicableProperties().stream().map(Property::getId).toList();

        return new RentalTypeResponse(rt.getId(), rt.getName(), rt.getDescription(), rt.getPriceMultiplier(),
                materials, rt.getStatus(), propertyIds);
    }

    private RentalType findOrThrow(Long id) {
        return rentalTypeRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("RentalType", id));
    }
}
