package com.panther.pms.facilities.repository;

import com.panther.pms.facilities.entity.DamageReport;
import com.panther.pms.facilities.entity.DamageStatus;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public final class DamageReportSpecifications {

    private DamageReportSpecifications() {
    }

    public static Specification<DamageReport> filter(Long propertyId, Long clientId, DamageStatus status) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (propertyId != null) {
                predicates.add(cb.equal(root.get("property").get("id"), propertyId));
            }
            if (clientId != null) {
                predicates.add(cb.equal(root.get("client").get("id"), clientId));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
