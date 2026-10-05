package com.panther.pms.finance.repository;

import com.panther.pms.finance.entity.RecurringBill;
import com.panther.pms.finance.entity.RecurringBillStatus;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public final class RecurringBillSpecifications {

    private RecurringBillSpecifications() {
    }

    public static Specification<RecurringBill> filter(Long propertyId, RecurringBillStatus status) {
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
