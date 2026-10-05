package com.panther.pms.leasing.repository;

import com.panther.pms.leasing.entity.Booking;
import com.panther.pms.leasing.entity.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Collection;

public interface BookingRepository extends JpaRepository<Booking, Long>, JpaSpecificationExecutor<Booking> {

    boolean existsByBookingNumber(String bookingNumber);

    Page<Booking> findByClientId(Long clientId, Pageable pageable);

    long countByAgentId(Long agentId);

    long countByStatusIn(Collection<BookingStatus> statuses);
}
