package com.panther.pms.leasing.repository;

import com.panther.pms.leasing.entity.Booking;
import com.panther.pms.leasing.entity.BookingStatus;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

public final class BookingSpecifications {

    private BookingSpecifications() {
    }

    public static Specification<Booking> filter(BookingStatus status, Long propertyId, String search) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (propertyId != null) {
                predicates.add(cb.equal(root.get("property").get("id"), propertyId));
            }
            if (StringUtils.hasText(search)) {
                String like = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("bookingNumber")), like),
                        cb.like(cb.lower(root.get("clientName")), like),
                        cb.like(cb.lower(root.get("clientEmail")), like)
                ));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
