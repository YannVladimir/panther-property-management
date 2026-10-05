package com.panther.pms.platform.controller;

import com.panther.pms.platform.dto.OccupancyPoint;
import com.panther.pms.platform.dto.PropertyPerformancePoint;
import com.panther.pms.platform.dto.RevenueExpensePoint;
import com.panther.pms.platform.service.ReportsService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('OPERATIONS', 'OWNER')")
public class ReportsController {

    private final ReportsService reportsService;

    @GetMapping("/revenue-expense")
    public List<RevenueExpensePoint> revenueExpense(@RequestParam(defaultValue = "6") int months) {
        return reportsService.revenueExpense(Math.min(Math.max(months, 1), 24));
    }

    @GetMapping("/occupancy")
    public List<OccupancyPoint> occupancy() {
        return reportsService.occupancy();
    }

    @GetMapping("/property-performance")
    public List<PropertyPerformancePoint> propertyPerformance() {
        return reportsService.propertyPerformance();
    }
}
