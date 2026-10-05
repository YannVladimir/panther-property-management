package com.panther.pms.facilities.repository;

import com.panther.pms.facilities.entity.InspectionStatus;
import com.panther.pms.facilities.entity.PreventiveTask;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public final class PreventiveTaskSpecifications {

    private PreventiveTaskSpecifications() {
    }

    public static Specification<PreventiveTask> filter(Long propertyId, InspectionStatus status) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (propertyId != null) {
                predicates.add(cb.equal(root.get("property").get("id"), propertyId));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
