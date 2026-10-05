package com.panther.pms.property.repository;

import com.panther.pms.property.entity.Property;
import com.panther.pms.property.entity.PropertyStatus;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

public final class PropertySpecifications {

    private PropertySpecifications() {
    }

    public static Specification<Property> filter(PropertyStatus status, String search, boolean publicViewOnly) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (publicViewOnly) {
                predicates.add(cb.equal(root.get("status"), PropertyStatus.ACTIVE));
            } else if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (StringUtils.hasText(search)) {
                String like = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), like),
                        cb.like(cb.lower(root.get("location")), like),
                        cb.like(cb.lower(root.get("city")), like),
                        cb.like(cb.lower(root.get("neighborhood")), like)
                ));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
