package com.panther.pms.common.audit;

import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public final class ActivityLogSpecifications {

    private ActivityLogSpecifications() {
    }

    public static Specification<ActivityLog> filter(String module, ActivityType type, Instant from, Instant to) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(module)) {
                predicates.add(cb.equal(root.get("module"), module));
            }
            if (type != null) {
                predicates.add(cb.equal(root.get("type"), type));
            }
            if (from != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("occurredAt"), from));
            }
            if (to != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("occurredAt"), to));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
