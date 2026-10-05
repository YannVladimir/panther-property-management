import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useOperationsDashboardQuery } from '../../api/dashboards';
import { useRevenueExpenseReportQuery, usePropertyPerformanceReportQuery } from '../../api/reports';
import { useRoomsQuery } from '../../api/rooms';
import { useClientsQuery } from '../../api/clients';
import { useBookingsQuery } from '../../api/bookings';
import { usePaymentsQuery } from '../../api/payments';
import { useExpensesQuery } from '../../api/expenses';
import { useRecurringBillsQuery, useMarkRecurringBillPaidMutation } from '../../api/recurringBills';
import { usePreventiveTasksQuery } from '../../api/preventiveTasks';
import { useEmployeesQuery } from '../../api/employees';
import {
  Building,
  DoorOpen,
  Users,
  CalendarCheck2,
  DollarSign,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  ClipboardCheck,
  Droplets,
  ArrowRight,
  Plus,
  Receipt,
  Sparkles,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { FinancialCalendar } from '../../components/common/FinancialCalendar';
import { OccupancyDonut } from '../../components/charts/OccupancyDonut';
import { RevenueExpenseArea } from '../../components/charts/RevenueExpenseArea';
import { PropertyPerformanceBar } from '../../components/charts/PropertyPerformanceBar';
import { useToast } from '../../context/ToastContext';

export const OperationsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { error: toastError } = useToast();

  const statsQuery = useOperationsDashboardQuery();
  const stats = statsQuery.data;

  const roomsQuery = useRoomsQuery();
  const rooms = roomsQuery.data ?? [];
  const clientsQuery = useClientsQuery();
  const clients = clientsQuery.data ?? [];
  const bookingsQuery = useBookingsQuery();
  const bookings = bookingsQuery.data ?? [];
  const paymentsQuery = usePaymentsQuery();
  const payments = paymentsQuery.data ?? [];
  const expensesQuery = useExpensesQuery();
  const expenses = expensesQuery.data ?? [];
  const recurringBillsQuery = useRecurringBillsQuery();
  const recurringBills = recurringBillsQuery.data ?? [];
  const markRecurringBillPaidMutation = useMarkRecurringBillPaidMutation();
  const markRecurringBillPaid = (billId: string) =>
    markRecurringBillPaidMutation.mutate(billId, {
      onError: () => toastError('Failed', 'Could not mark this bill as paid.'),
    });
  const preventiveTasksQuery = usePreventiveTasksQuery();
  const preventiveTasks = preventiveTasksQuery.data ?? [];
  const employeesQuery = useEmployeesQuery();
  const employees = employeesQuery.data ?? [];
  const revenueExpenseQuery = useRevenueExpenseReportQuery(8);
  const propertyPerformanceQuery = usePropertyPerformanceReportQuery();

  // All employee daily tasks
  const allStaffTasks = employees.flatMap((emp) =>
    (emp.dailyTasks || []).map((t) => ({ ...t, employeeName: emp.name, employeeAvatar: emp.avatar, employeeId: emp.id }))
  );
  const completedStaffTasks = allStaffTasks.filter((t) => t.status === 'Completed');

  // Room-status breakdown is real, persisted per-room data (not a duplicated backend aggregate) —
  // legitimate to compute client-side from the real room list.
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter((r) => r.status === 'occupied').length;
  const availableRooms = rooms.filter((r) => r.status === 'available').length;
  const reservedRooms = rooms.filter((r) => r.status === 'reserved').length;
  const maintenanceRooms = rooms.filter((r) => r.status === 'maintenance').length;

  const pendingBookings = bookings.filter((b) => b.status === 'requested' || b.status === 'under_review');
  const outstandingPayments = payments.filter((p) => p.status === 'pending' || p.status === 'overdue');
  const outstandingAmount = outstandingPayments.reduce((acc, p) => acc + p.amount, 0);

  // Occupancy/pending-bookings/monthly-revenue come from the backend's own dashboard aggregate
  // (GET /dashboard/operations) rather than being recomputed client-side — per the plan's
  // correctness-trap warning about not shadowing backend-computed values. There's no equivalent
  // aggregate for total expenses, so that (and net income) are summed from the real expenses list.
  const occupancyRate = stats ? Math.round(stats.occupancyRatePercent) : 0;
  const totalMonthlyRevenue = stats?.monthlyRevenue ?? 0;
  const totalMonthlyExpenses = expenses.filter((e) => e.status === 'paid').reduce((acc, e) => acc + e.amount, 0);
  const netIncome = totalMonthlyRevenue - totalMonthlyExpenses;

  const flaggedPreventive = preventiveTasks.filter((t) => t.status === 'needs_attention' || t.status === 'failed');

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 text-xs font-bold mb-1 border border-brand-200 dark:border-brand-800/60">
            <Sparkles className="w-3.5 h-3.5" />
            Operations Command Center • Kigali Portfolios
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 dark:text-white">
            Operations & Property Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time control for 5 prime estates, 130 managed suites, bookings and preventive facility schedules.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate('/operations/bookings')}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md hover:shadow-glow transition-all flex items-center gap-2"
          >
            <CalendarCheck2 className="w-4 h-4" />
            <span>Manage Bookings ({pendingBookings.length})</span>
          </button>
          <button
            onClick={() => navigate('/operations/payments')}
            className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2"
          >
            <Receipt className="w-4 h-4 text-emerald-400" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Portfolio Occupancy"
          value={`${occupancyRate}%`}
          subtitle={`${occupiedRooms} of ${totalRooms} suites occupied`}
          icon={Building}
          accentColor="brand"
          trend={{ value: '+4.2% vs last month', isPositive: true }}
          onClick={() => navigate('/operations/properties')}
        />
        <StatCard
          title="Monthly Collections"
          value={`$${totalMonthlyRevenue.toLocaleString()}`}
          subtitle="August 2026 recorded rent"
          icon={DollarSign}
          accentColor="emerald"
          trend={{ value: '94% collection rate', isPositive: true }}
          onClick={() => navigate('/operations/payments')}
        />
        <StatCard
          title="Operational Expenses"
          value={`$${totalMonthlyExpenses.toLocaleString()}`}
          subtitle="Utilities, security & maintenance"
          icon={TrendingDown}
          accentColor="rose"
          onClick={() => navigate('/operations/expenses')}
        />
        <StatCard
          title="Net Operating Income"
          value={`$${netIncome.toLocaleString()}`}
          subtitle="Gross collections less expenses"
          icon={TrendingUp}
          accentColor="emerald"
          trend={{ value: '+12% margin', isPositive: true }}
        />
      </div>

      {/* Secondary Operational Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div
          onClick={() => navigate('/operations/bookings')}
          className="glass-card p-4 rounded-2xl border shadow-soft cursor-pointer hover:border-brand-500 transition-colors"
        >
          <span className="text-[10px] uppercase font-bold text-slate-400">Pending Bookings</span>
          <p className="text-xl font-bold font-display text-amber-500 mt-1">{pendingBookings.length} In Review</p>
        </div>
        <div
          onClick={() => navigate('/operations/properties')}
          className="glass-card p-4 rounded-2xl border shadow-soft cursor-pointer hover:border-brand-500 transition-colors"
        >
          <span className="text-[10px] uppercase font-bold text-slate-400">Available Units</span>
          <p className="text-xl font-bold font-display text-sky-500 mt-1">{availableRooms} Ready</p>
        </div>
        <div
          onClick={() => navigate('/operations/properties')}
          className="glass-card p-4 rounded-2xl border shadow-soft cursor-pointer hover:border-brand-500 transition-colors"
        >
          <span className="text-[10px] uppercase font-bold text-slate-400">Under Maintenance</span>
          <p className="text-xl font-bold font-display text-rose-500 mt-1">{maintenanceRooms} Suites</p>
        </div>
        <div
          onClick={() => navigate('/operations/payments')}
          className="glass-card p-4 rounded-2xl border shadow-soft cursor-pointer hover:border-brand-500 transition-colors"
        >
          <span className="text-[10px] uppercase font-bold text-slate-400">Overdue Balances</span>
          <p className="text-xl font-bold font-display text-rose-500 mt-1">${outstandingAmount.toLocaleString()}</p>
        </div>
        <div
          onClick={() => navigate('/operations/preventive-maintenance')}
          className="glass-card p-4 rounded-2xl border shadow-soft cursor-pointer hover:border-brand-500 transition-colors"
        >
          <span className="text-[10px] uppercase font-bold text-slate-400">Preventive Tasks</span>
          <p className="text-xl font-bold font-display text-emerald-500 mt-1">
            {preventiveTasks.filter((t) => t.status === 'pass').length}/{preventiveTasks.length} Checked
          </p>
        </div>
        <div
          onClick={() => navigate('/operations/clients')}
          className="glass-card p-4 rounded-2xl border shadow-soft cursor-pointer hover:border-brand-500 transition-colors"
        >
          <span className="text-[10px] uppercase font-bold text-slate-400">Active Tenants</span>
          <p className="text-xl font-bold font-display text-slate-900 dark:text-white mt-1">{clients.length} Clients</p>
        </div>
      </div>

      {/* Interactive Financial & Billing Calendar */}
      <FinancialCalendar
        payments={payments}
        recurringBills={recurringBills}
        expenses={expenses}
        onMarkBillPaid={markRecurringBillPaid}
        variant="operations"
      />

      {/* Charts Row: Occupancy Donut & Revenue Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Occupancy Donut */}
        <div className="glass-card p-6 rounded-3xl shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
              Portfolio Unit Distribution
            </h3>
            <span className="text-xs text-slate-400">{totalRooms} Total Units</span>
          </div>
          <OccupancyDonut
            occupied={occupiedRooms}
            available={availableRooms}
            reserved={reservedRooms}
            maintenance={maintenanceRooms}
          />
        </div>

        {/* Revenue vs Expenses Area Trend */}
        <div className="lg:col-span-2 glass-card p-6 rounded-3xl shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
                Monthly Financial Trajectory (2026)
              </h3>
              <p className="text-xs text-slate-500">Gross revenue, operational costs & net income</p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg">
              +$103,700 Net (Aug)
            </span>
          </div>
          <RevenueExpenseArea data={revenueExpenseQuery.data ?? []} />
        </div>
      </div>

      {/* Staff Daily Tasks & Work Orders Dispatch Section */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl shadow-soft space-y-5 border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 font-bold text-[10px] mb-1">
              <span>Shift Operations & Work Orders</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold font-display text-slate-900 dark:text-white">
              Staff Daily Tasks & Shift Progress
            </h2>
            <p className="text-xs text-slate-500">
              Live operational tasks dispatched to on-duty compound staff, maintenance techs, and housekeepers.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs border border-emerald-200 dark:border-emerald-800">
              {completedStaffTasks.length}/{allStaffTasks.length} Completed Today
            </span>
            <Link
              to="/operations/hr-payroll"
              className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
            >
              <span>Manage in HR & Tasks</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allStaffTasks.slice(0, 6).map((task) => (
            <div
              key={task.id}
              onClick={() => navigate(`/operations/hr-payroll/${task.employeeId}`)}
              className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 hover:border-brand-400 transition-all cursor-pointer space-y-2.5 shadow-xs hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src={task.employeeAvatar}
                    alt={task.employeeName}
                    className="w-6 h-6 rounded-full object-cover border border-slate-200 dark:border-slate-600"
                  />
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                    {task.employeeName}
                  </span>
                </div>
                <Badge
                  variant={
                    task.priority === 'High'
                      ? 'danger'
                      : task.priority === 'Medium'
                      ? 'warning'
                      : 'neutral'
                  }
                  size="sm"
                >
                  {task.priority}
                </Badge>
              </div>

              <div>
                <h4 className="font-extrabold text-xs text-slate-900 dark:text-white line-clamp-1">
                  {task.title}
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{task.description}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px]">
                <span className="text-slate-400 font-medium">Due: {task.dueDate}</span>
                <Badge
                  variant={
                    task.status === 'Completed'
                      ? 'success'
                      : task.status === 'In Progress'
                      ? 'warning'
                      : 'neutral'
                  }
                  size="sm"
                  dot
                >
                  {task.status.toUpperCase()}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Property Comparative Performance & Action Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Property Performance Bar Chart */}
        <div className="lg:col-span-2 glass-card p-6 rounded-3xl shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
                Property Occupancy Benchmarks
              </h3>
              <p className="text-xs text-slate-500">Comparative occupancy % across Kigali properties</p>
            </div>
            <Link to="/operations/properties" className="text-xs font-bold text-brand-600 hover:underline">
              View Properties →
            </Link>
          </div>
          <PropertyPerformanceBar properties={propertyPerformanceQuery.data ?? []} />
        </div>

        {/* Live Operational Alerts & Recent Activity */}
        <div className="glass-card p-6 rounded-3xl shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
              Action Required
            </h3>
            <span className="text-xs bg-amber-50 text-amber-600 dark:bg-amber-950 px-2 py-0.5 rounded-full font-bold">
              {pendingBookings.length + flaggedPreventive.length} Alerts
            </span>
          </div>

          <div className="space-y-3">
            {pendingBookings.map((b) => (
              <div
                key={b.id}
                onClick={() => navigate('/operations/bookings')}
                className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 cursor-pointer hover:bg-amber-100/60 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-amber-800 dark:text-amber-300">
                    Booking Awaiting Review
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{b.bookingNumber}</span>
                </div>
                <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">{b.clientName}</p>
                <p className="text-[11px] text-slate-500">{b.propertyName} • ${b.monthlyRent}/mo</p>
              </div>
            ))}

            {flaggedPreventive.map((t) => (
              <div
                key={t.id}
                onClick={() => navigate('/operations/preventive-maintenance')}
                className="p-3 rounded-2xl bg-rose-50/60 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 cursor-pointer hover:bg-rose-100/60 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-rose-800 dark:text-rose-300">
                    Facility Task Flagged
                  </span>
                  <span className="text-[10px] text-slate-400">{t.category}</span>
                </div>
                <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">{t.taskName}</p>
                <p className="text-[11px] text-rose-600 dark:text-rose-400 line-clamp-1">{t.remarks}</p>
              </div>
            ))}
          </div>

          <Link
            to="/operations/activity-log"
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold hover:bg-slate-200 transition-colors"
          >
            <span>View Complete Activity Log</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
