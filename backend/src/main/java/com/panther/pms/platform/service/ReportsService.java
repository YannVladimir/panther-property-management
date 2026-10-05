package com.panther.pms.platform.service;

import com.panther.pms.finance.entity.ExpenseStatus;
import com.panther.pms.finance.entity.PaymentStatus;
import com.panther.pms.finance.repository.ExpenseRepository;
import com.panther.pms.finance.repository.PaymentRepository;
import com.panther.pms.platform.dto.OccupancyPoint;
import com.panther.pms.platform.dto.PropertyPerformancePoint;
import com.panther.pms.platform.dto.RevenueExpensePoint;
import com.panther.pms.property.entity.Property;
import com.panther.pms.property.entity.RoomStatus;
import com.panther.pms.property.repository.PropertyRepository;
import com.panther.pms.property.repository.RoomRepository;
import com.panther.pms.property.repository.RoomStatusCount;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Chart-ready aggregates for ReportsPage. CSV/PDF export (GET /reports/export) and a dedicated
 * water-consumption series are deliberately deferred — see BACKEND_PLAN.md section 10, Phase 7.
 */
@Service
@RequiredArgsConstructor
public class ReportsService {

    private static final DateTimeFormatter MONTH_LABEL = DateTimeFormatter.ofPattern("MMM yyyy", Locale.ENGLISH);

    private final PaymentRepository paymentRepository;
    private final ExpenseRepository expenseRepository;
    private final PropertyRepository propertyRepository;
    private final RoomRepository roomRepository;

    public List<RevenueExpensePoint> revenueExpense(int months) {
        List<RevenueExpensePoint> points = new ArrayList<>();
        YearMonth current = YearMonth.now();

        for (int i = months - 1; i >= 0; i--) {
            YearMonth ym = current.minusMonths(i);
            BigDecimal revenue = paymentRepository.sumAmountByStatusAndDateBetween(PaymentStatus.PAID, ym.atDay(1), ym.atEndOfMonth());
            BigDecimal expenses = expenseRepository.sumAmountByStatusAndDateBetween(ExpenseStatus.PAID, ym.atDay(1), ym.atEndOfMonth());
            points.add(new RevenueExpensePoint(ym.format(MONTH_LABEL), revenue, expenses));
        }

        return points;
    }

    public List<OccupancyPoint> occupancy() {
        return propertyRepository.findAll().stream()
                .map(this::toOccupancyPoint)
                .toList();
    }

    public List<PropertyPerformancePoint> propertyPerformance() {
        YearMonth current = YearMonth.now();
        return propertyRepository.findAll().stream()
                .map(p -> {
                    BigDecimal revenue = paymentRepository.sumAmountByPropertyAndStatusAndDateBetween(
                            p.getId(), PaymentStatus.PAID, current.atDay(1), current.atEndOfMonth());
                    OccupancyPoint occ = toOccupancyPoint(p);
                    return new PropertyPerformancePoint(p.getId(), p.getName(), revenue, occ.occupancyRatePercent());
                })
                .toList();
    }

    private OccupancyPoint toOccupancyPoint(Property property) {
        int occupied = 0;
        int total = 0;
        for (RoomStatusCount rsc : roomRepository.countGroupedByStatusForProperty(property.getId())) {
            total += rsc.getCount();
            if (rsc.getStatus() == RoomStatus.OCCUPIED) {
                occupied += rsc.getCount();
            }
        }
        double rate = total == 0 ? 0.0 : Math.round(occupied * 10000.0 / total) / 100.0;
        return new OccupancyPoint(property.getId(), property.getName(), total, occupied, rate);
    }
}
