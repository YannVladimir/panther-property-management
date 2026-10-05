package com.panther.pms.finance.repository;

import com.panther.pms.finance.entity.Expense;
import com.panther.pms.finance.entity.ExpenseStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;

public interface ExpenseRepository extends JpaRepository<Expense, Long>, JpaSpecificationExecutor<Expense> {

    @Query("select coalesce(sum(e.amount), 0) from Expense e where e.status = :status and e.date between :from and :to")
    BigDecimal sumAmountByStatusAndDateBetween(@Param("status") ExpenseStatus status,
                                                @Param("from") LocalDate from, @Param("to") LocalDate to);
}
