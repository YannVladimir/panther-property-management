package com.panther.pms.facilities.repository;

import com.panther.pms.facilities.entity.IssueStatus;
import com.panther.pms.facilities.entity.MaintenanceIssue;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public final class MaintenanceIssueSpecifications {

    private MaintenanceIssueSpecifications() {
    }

    public static Specification<MaintenanceIssue> filter(IssueStatus status, Long propertyId, Long clientId) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (propertyId != null) {
                predicates.add(cb.equal(root.get("property").get("id"), propertyId));
            }
            if (clientId != null) {
                predicates.add(cb.equal(root.get("client").get("id"), clientId));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
