package com.panther.pms.platform.service;

import com.panther.pms.facilities.repository.TechnicianRepository;
import com.panther.pms.facilities.repository.TechnicianSpecifications;
import com.panther.pms.hr.repository.EmployeeRepository;
import com.panther.pms.hr.repository.EmployeeSpecifications;
import com.panther.pms.leasing.repository.BookingRepository;
import com.panther.pms.leasing.repository.BookingSpecifications;
import com.panther.pms.leasing.repository.ClientRepository;
import com.panther.pms.leasing.repository.ClientSpecifications;
import com.panther.pms.platform.dto.SearchResultItem;
import com.panther.pms.property.repository.PropertyRepository;
import com.panther.pms.property.repository.PropertySpecifications;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * Backs the frontend's GlobalSearchModal — a shallow fan-out across the domains it names
 * explicitly (properties, clients, bookings, employees, technicians), capped to a handful of
 * results per category. Not a full-text/relevance search engine — see BACKEND_PLAN.md section 9.
 */
@Service
@RequiredArgsConstructor
public class SearchService {

    private static final int LIMIT_PER_CATEGORY = 5;

    private final PropertyRepository propertyRepository;
    private final ClientRepository clientRepository;
    private final BookingRepository bookingRepository;
    private final EmployeeRepository employeeRepository;
    private final TechnicianRepository technicianRepository;

    public List<SearchResultItem> search(String query) {
        List<SearchResultItem> results = new ArrayList<>();
        if (query == null || query.isBlank()) {
            return results;
        }

        var page = PageRequest.of(0, LIMIT_PER_CATEGORY);

        propertyRepository.findAll(PropertySpecifications.filter(null, query, false), page)
                .forEach(p -> results.add(new SearchResultItem("PROPERTY", p.getId(), p.getName(), p.getLocation())));

        clientRepository.findAll(ClientSpecifications.filter(null, query), page)
                .forEach(c -> results.add(new SearchResultItem("CLIENT", c.getId(), c.getName(), c.getEmail())));

        bookingRepository.findAll(BookingSpecifications.filter(null, null, query), page)
                .forEach(b -> results.add(new SearchResultItem("BOOKING", b.getId(), b.getBookingNumber(), b.getClientName())));

        employeeRepository.findAll(EmployeeSpecifications.filter(null, null, query), page)
                .forEach(e -> results.add(new SearchResultItem("EMPLOYEE", e.getId(), e.getName(), e.getPosition())));

        technicianRepository.findAll(TechnicianSpecifications.filter(null, query), page)
                .forEach(t -> results.add(new SearchResultItem("TECHNICIAN", t.getId(), t.getName(), t.getCompany())));

        return results;
    }
}
