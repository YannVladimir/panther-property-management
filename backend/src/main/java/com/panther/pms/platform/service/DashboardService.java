package com.panther.pms.platform.service;

import com.panther.pms.common.exception.ResourceNotFoundException;
import com.panther.pms.facilities.entity.IssueStatus;
import com.panther.pms.facilities.repository.MaintenanceIssueRepository;
import com.panther.pms.finance.entity.ExpenseStatus;
import com.panther.pms.finance.entity.PaymentStatus;
import com.panther.pms.finance.entity.RecurringBillStatus;
import com.panther.pms.finance.repository.ExpenseRepository;
import com.panther.pms.finance.repository.PaymentRepository;
import com.panther.pms.finance.repository.RecurringBillRepository;
import com.panther.pms.hr.entity.DailyTaskStatus;
import com.panther.pms.hr.entity.Employee;
import com.panther.pms.hr.repository.EmployeeRepository;
import com.panther.pms.iam.entity.UserRole;
import com.panther.pms.iam.repository.UserRepository;
import com.panther.pms.leasing.entity.BookingStatus;
import com.panther.pms.leasing.entity.Client;
import com.panther.pms.leasing.repository.BookingRepository;
import com.panther.pms.leasing.repository.ClientRepository;
import com.panther.pms.platform.dto.AdminDashboardResponse;
import com.panther.pms.platform.dto.ClientDashboardResponse;
import com.panther.pms.platform.dto.HouseholdDashboardResponse;
import com.panther.pms.platform.dto.OperationsDashboardResponse;
import com.panther.pms.platform.dto.OwnerDashboardResponse;
import com.panther.pms.common.audit.ActivityLogRepository;
import com.panther.pms.platform.repository.NotificationRecipientRepository;
import com.panther.pms.property.entity.RoomStatus;
import com.panther.pms.property.repository.PropertyRepository;
import com.panther.pms.property.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.TemporalAdjusters;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private static final List<IssueStatus> CLOSED_ISSUE_STATUSES = List.of(IssueStatus.RESOLVED, IssueStatus.CLOSED);
    private static final List<BookingStatus> PENDING_BOOKING_STATUSES = List.of(BookingStatus.REQUESTED, BookingStatus.UNDER_REVIEW);

    private final BookingRepository bookingRepository;
    private final RoomRepository roomRepository;
    private final PaymentRepository paymentRepository;
    private final ExpenseRepository expenseRepository;
    private final RecurringBillRepository recurringBillRepository;
    private final MaintenanceIssueRepository maintenanceIssueRepository;
    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final ActivityLogRepository activityLogRepository;
    private final ClientRepository clientRepository;
    private final NotificationRecipientRepository notificationRecipientRepository;
    private final EmployeeRepository employeeRepository;

    public OperationsDashboardResponse operations() {
        LocalDate from = YearMonth.now().atDay(1);
        LocalDate to = YearMonth.now().atEndOfMonth();

        long pendingBookings = bookingRepository.countByStatusIn(PENDING_BOOKING_STATUSES);
        double occupancyRate = occupancyRatePercent();
        BigDecimal monthlyRevenue = paymentRepository.sumAmountByStatusAndDateBetween(PaymentStatus.PAID, from, to);
        long overdueBills = recurringBillRepository.countByStatus(RecurringBillStatus.OVERDUE);
        long openIssues = maintenanceIssueRepository.countByStatusNotIn(CLOSED_ISSUE_STATUSES);

        return new OperationsDashboardResponse(pendingBookings, occupancyRate, monthlyRevenue, overdueBills, openIssues);
    }

    public OwnerDashboardResponse owner() {
        LocalDate from = YearMonth.now().atDay(1);
        LocalDate to = YearMonth.now().atEndOfMonth();

        long totalProperties = propertyRepository.count();
        double occupancyRate = occupancyRatePercent();
        BigDecimal revenue = paymentRepository.sumAmountByStatusAndDateBetween(PaymentStatus.PAID, from, to);
        BigDecimal expenses = expenseRepository.sumAmountByStatusAndDateBetween(ExpenseStatus.PAID, from, to);
        BigDecimal noi = revenue.subtract(expenses);

        return new OwnerDashboardResponse(totalProperties, occupancyRate, revenue, expenses, noi);
    }

    public AdminDashboardResponse admin() {
        long totalUsers = userRepository.count();
        Map<String, Long> byRole = new LinkedHashMap<>();
        for (UserRole role : UserRole.values()) {
            byRole.put(role.name(), userRepository.countByRole(role));
        }
        long totalProperties = propertyRepository.count();
        long activityLast24h = activityLogRepository.countByOccurredAtAfter(Instant.now().minusSeconds(86_400));

        return new AdminDashboardResponse(totalUsers, byRole, totalProperties, activityLast24h);
    }

    public ClientDashboardResponse client(Long userId, Long clientId) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> ResourceNotFoundException.of("Client", clientId));

        long openIssues = maintenanceIssueRepository.countByClientIdAndStatusNotIn(clientId, CLOSED_ISSUE_STATUSES);
        long unreadNotifications = notificationRecipientRepository.countByUserIdAndReadAtIsNull(userId);

        return new ClientDashboardResponse(
                client.getCurrentRoom() != null ? client.getCurrentRoom().getRoomNumber() : null,
                client.getCurrentProperty() != null ? client.getCurrentProperty().getName() : null,
                client.getMonthlyRent(), client.getPaymentStatus().name(), client.getLeaseExpiryDate(),
                openIssues, unreadNotifications
        );
    }

    public HouseholdDashboardResponse household(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> ResourceNotFoundException.of("Employee", employeeId));

        LocalDate today = LocalDate.now();
        LocalDate weekStart = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));

        long todaysTasks = employee.getDailyTasks().stream()
                .filter(t -> today.equals(t.getDueDate())
                        && t.getStatus() != DailyTaskStatus.COMPLETED && t.getStatus() != DailyTaskStatus.REJECTED)
                .count();

        long completedThisWeek = employee.getDailyTasks().stream()
                .filter(t -> t.getStatus() == DailyTaskStatus.COMPLETED
                        && t.getCompletedDate() != null && !t.getCompletedDate().isBefore(weekStart))
                .count();

        java.util.OptionalDouble avg = employee.getDailyTasks().stream()
                .map(com.panther.pms.hr.entity.EmployeeDailyTask::getRating)
                .filter(java.util.Objects::nonNull)
                .mapToInt(Integer::intValue)
                .average();
        Double averageRating = avg.isPresent() ? avg.getAsDouble() : null;

        return new HouseholdDashboardResponse(todaysTasks, completedThisWeek, averageRating);
    }

    private double occupancyRatePercent() {
        long total = roomRepository.count();
        if (total == 0) {
            return 0.0;
        }
        long occupied = roomRepository.countByStatus(RoomStatus.OCCUPIED);
        return Math.round((occupied * 10000.0 / total)) / 100.0;
    }
}
