package com.panther.pms.finance.repository;

import com.panther.pms.finance.entity.Payment;
import com.panther.pms.finance.entity.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;

public interface PaymentRepository extends JpaRepository<Payment, Long>, JpaSpecificationExecutor<Payment> {

    boolean existsByInvoiceNumber(String invoiceNumber);

    Page<Payment> findByClientId(Long clientId, Pageable pageable);

    @Query("select coalesce(sum(p.amount), 0) from Payment p where p.status = :status and p.date between :from and :to")
    BigDecimal sumAmountByStatusAndDateBetween(@Param("status") PaymentStatus status,
                                                @Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("select coalesce(sum(p.amount), 0) from Payment p where p.property.id = :propertyId and p.status = :status and p.date between :from and :to")
    BigDecimal sumAmountByPropertyAndStatusAndDateBetween(@Param("propertyId") Long propertyId, @Param("status") PaymentStatus status,
                                                           @Param("from") LocalDate from, @Param("to") LocalDate to);
}
