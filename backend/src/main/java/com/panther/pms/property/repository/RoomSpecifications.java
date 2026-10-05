package com.panther.pms.property.repository;

import com.panther.pms.property.entity.FurnishingType;
import com.panther.pms.property.entity.Room;
import com.panther.pms.property.entity.RoomStatus;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public final class RoomSpecifications {

    private RoomSpecifications() {
    }

    public static Specification<Room> filter(Long propertyId, RoomStatus status, FurnishingType furnishingType,
                                              BigDecimal minPrice, BigDecimal maxPrice, String search) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (propertyId != null) {
                predicates.add(cb.equal(root.get("property").get("id"), propertyId));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (furnishingType != null) {
                predicates.add(cb.equal(root.get("furnishingType"), furnishingType));
            }
            if (minPrice != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("monthlyRent"), minPrice));
            }
            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("monthlyRent"), maxPrice));
            }
            if (StringUtils.hasText(search)) {
                predicates.add(cb.like(cb.lower(root.get("roomNumber")), "%" + search.toLowerCase() + "%"));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
