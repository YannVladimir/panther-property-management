package com.panther.pms.facilities.repository;

import com.panther.pms.facilities.entity.Technician;
import com.panther.pms.facilities.entity.TechnicianSpecialization;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

public final class TechnicianSpecifications {

    private TechnicianSpecifications() {
    }

    public static Specification<Technician> filter(TechnicianSpecialization specialization, String search) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (specialization != null) {
                predicates.add(cb.equal(root.get("specialization"), specialization));
            }
            if (StringUtils.hasText(search)) {
                String like = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), like),
                        cb.like(cb.lower(root.get("company")), like)
                ));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
