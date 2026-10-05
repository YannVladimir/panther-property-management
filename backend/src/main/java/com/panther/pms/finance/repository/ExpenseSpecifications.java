package com.panther.pms.finance.repository;

import com.panther.pms.finance.entity.Expense;
import com.panther.pms.finance.entity.ExpenseCategory;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public final class ExpenseSpecifications {

    private ExpenseSpecifications() {
    }

    public static Specification<Expense> filter(Long propertyId, ExpenseCategory category) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (propertyId != null) {
                predicates.add(cb.equal(root.get("property").get("id"), propertyId));
            }
            if (category != null) {
                predicates.add(cb.equal(root.get("category"), category));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
