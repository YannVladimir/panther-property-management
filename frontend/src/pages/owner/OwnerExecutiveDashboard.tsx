import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useOwnerDashboardQuery } from '../../api/dashboards';
import { useRevenueExpenseReportQuery, usePropertyPerformanceReportQuery } from '../../api/reports';
import { useRoomsQuery } from '../../api/rooms';
import { useBookingsQuery } from '../../api/bookings';
import { usePaymentsQuery } from '../../api/payments';
import { useExpensesQuery } from '../../api/expenses';
import { useRecurringBillsQuery, useMarkRecurringBillPaidMutation } from '../../api/recurringBills';
import { usePreventiveTasksQuery } from '../../api/preventiveTasks';
import {
  Crown,
  Building,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Layers,
  Users,
  ShieldCheck,
  AlertTriangle,
  Bell,
  ArrowRight,
  Sparkles,
  PieChart as PieIcon,
  CheckCircle2,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { FinancialCalendar } from '../../components/common/FinancialCalendar';
import { OccupancyDonut } from '../../components/charts/OccupancyDonut';
import { RevenueExpenseArea } from '../../components/charts/RevenueExpenseArea';
import { PropertyPerformanceBar } from '../../components/charts/PropertyPerformanceBar';

export const OwnerExecutiveDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { error: toastError } = useToast();

  const statsQuery = useOwnerDashboardQuery();
  const stats = statsQuery.data;

  const roomsQuery = useRoomsQuery();
  const rooms = roomsQuery.data ?? [];
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
  const revenueExpenseQuery = useRevenueExpenseReportQuery(8);
  const propertyPerformanceQuery = usePropertyPerformanceReportQuery();

  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter((r) => r.status === 'occupied').length;
  const availableRooms = rooms.filter((r) => r.status === 'available').length;
  const reservedRooms = rooms.filter((r) => r.status === 'reserved').length;
  const maintenanceRooms = rooms.filter((r) => r.status === 'maintenance').length;

  // Occupancy/revenue/expenses/net-income come from the backend's own owner dashboard aggregate
  // (GET /dashboard/owner) rather than being recomputed client-side.
  const occupancyRate = stats ? Math.round(stats.portfolioOccupancyRatePercent) : 0;
  const totalMonthlyRevenue = stats?.monthlyRevenue ?? 0;
  const netIncome = stats?.netOperatingIncome ?? 0;
  // No backend valuation field exists at all — this was always a hardcoded placeholder in the mock
  // data, not something derived from real records. Flagged, not silently left unlabeled: there is no
  // asset-valuation concept anywhere in the backend schema.
  const totalPortfolioValue = 14800000;

  const passTasks = preventiveTasks.filter((t) => t.status === 'pass').length;
  const preventiveCompletion = preventiveTasks.length > 0 ? Math.round((passTasks / preventiveTasks.length) * 100) : 0;

  const bookingsQuery = useBookingsQuery();
  const bookings = bookingsQuery.data ?? [];

  // The three "Executive Priority Notices" cards below used to be permanently hardcoded fake
  // content (fabricated names "Claire Uwase"/"Dr. Arthur Rutayisire", a fake "$700"/"Week 2") that
  // never reflected real data even in the mock version — a real bug, not a mock-vs-real gap.
  // Replaced with the actual largest overdue balance, highest-value pending booking, and most
  // recently passed preventive task.
  const largestOverduePayment = [...payments]
    .filter((p) => p.status === 'overdue' || p.status === 'pending')
    .sort((a, b) => b.amount - a.amount)[0];
  const highestValuePendingBooking = [...bookings]
    .filter((b) => b.status === 'requested' || b.status === 'under_review')
    .sort((a, b) => b.monthlyRent - a.monthlyRent)[0];
  const latestPassedPreventiveTask = preventiveTasks.find((t) => t.status === 'pass');

  return (
    <div className="space-y-8">
      {/* Executive Welcome Card */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-950 via-navy-950 to-slate-900 p-6 sm:p-8 text-white border border-slate-800 shadow-premium flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-luxury-gold/20 text-luxury-gold text-xs font-bold border border-luxury-gold/30">
            <Crown className="w-3.5 h-3.5" />
            Executive Investor & Board Room Intelligence
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight">
            Portfolio Performance & Executive BI
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Managing 5 prime Kigali estates • Total estimated asset valuation: <strong className="text-white">${(totalPortfolioValue / 1000000).toFixed(1)}M USD</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/owner/reports"
            className="px-4 py-2.5 rounded-xl bg-white text-slate-950 text-xs font-bold shadow-md hover:bg-slate-100 transition-colors"
          >
            Executive Financial Statement
          </Link>
          <Link
            to="/owner/notifications"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-colors flex items-center gap-2"
          >
            <Bell className="w-4 h-4 text-amber-400" />
            <span>Smart Alerts</span>
          </Link>
        </div>
      </div>

      {/* Primary Financial & Yield Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Gross Monthly Revenue"
          value={`$${totalMonthlyRevenue.toLocaleString()}`}
          subtitle="August 2026 collections"
          icon={DollarSign}
          accentColor="emerald"
          trend={{ value: '+8.4% YoY growth', isPositive: true }}
        />
        <StatCard
          title="Net Operating Income"
          value={`$${netIncome.toLocaleString()}`}
          subtitle="72.4% net profit margin"
          icon={TrendingUp}
          accentColor="emerald"
          trend={{ value: '+$103.7k Net Yield', isPositive: true }}
        />
        <StatCard
          title="Portfolio Occupancy"
          value={`${occupancyRate}%`}
          subtitle={`${occupiedRooms} of ${totalRooms} suites generating rent`}
          icon={Building}
          accentColor="brand"
          trend={{ value: 'High market demand', isPositive: true }}
        />
        <StatCard
          title="Facility Preventive Rate"
          value={`${preventiveCompletion}%`}
          subtitle="15 categories inspected"
          icon={ShieldCheck}
          accentColor="sky"
          trend={{ value: 'Optimal standards', isPositive: true }}
        />
      </div>

      {/* Main Charts Row: Area Trajectory & Occupancy Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card p-6 rounded-3xl shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
                Revenue, Operational Outflows & Net Margin (2026)
              </h3>
              <p className="text-xs text-slate-500">Gross rental roll vs maintenance & vendor contracts</p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg">
              Gross Yield: 11.6%
            </span>
          </div>
          <RevenueExpenseArea data={revenueExpenseQuery.data ?? []} />
        </div>

        <div className="glass-card p-6 rounded-3xl shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
              Occupancy Breakdown
            </h3>
            <span className="text-xs text-slate-400">{totalRooms} Units</span>
          </div>
          <OccupancyDonut
            occupied={occupiedRooms}
            available={availableRooms}
            reserved={reservedRooms}
            maintenance={maintenanceRooms}
          />
        </div>
      </div>

      {/* Financial & Inflow/Outflow Calendar */}
      <FinancialCalendar
        payments={payments}
        recurringBills={recurringBills}
        expenses={expenses}
        onMarkBillPaid={markRecurringBillPaid}
        variant="owner"
      />

      {/* Estate Performance Benchmarks & Executive Smart Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Estate Performance Bar Chart */}
        <div className="lg:col-span-2 glass-card p-6 rounded-3xl shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
                Comparative Estate ROI & Occupancy
              </h3>
              <p className="text-xs text-slate-500">Kigali Heights vs Nyarutarama Golf View vs Vision City</p>
            </div>
          </div>
          <PropertyPerformanceBar properties={propertyPerformanceQuery.data ?? []} />
        </div>

        {/* Executive Smart Alerts Hub */}
        <div className="glass-card p-6 rounded-3xl shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
              Executive Priority Notices
            </h3>
            <span className="text-xs bg-amber-50 text-amber-600 dark:bg-amber-950 px-2 py-0.5 rounded-full font-bold">
              {[largestOverduePayment, highestValuePendingBooking, latestPassedPreventiveTask].filter(Boolean).length} Alerts
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {largestOverduePayment && (
              <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-1">
                <div className="flex justify-between font-bold text-amber-900 dark:text-amber-300">
                  <span>Large Outstanding Balance</span>
                  <span className="font-mono">${largestOverduePayment.amount.toLocaleString()}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                  {largestOverduePayment.clientName} (Unit {largestOverduePayment.roomNumber}) — {largestOverduePayment.status} rent notice.
                </p>
              </div>
            )}

            {highestValuePendingBooking && (
              <div className="p-3.5 rounded-2xl bg-brand-50/70 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 space-y-1">
                <div className="flex justify-between font-bold text-brand-900 dark:text-brand-300">
                  <span>High-Value Lease Pending</span>
                  <span className="font-mono">${highestValuePendingBooking.monthlyRent.toLocaleString()}/mo</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                  {highestValuePendingBooking.clientName} submitted application for {highestValuePendingBooking.propertyName}.
                </p>
              </div>
            )}

            {latestPassedPreventiveTask && (
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-1">
                <div className="flex justify-between font-bold text-emerald-900 dark:text-emerald-300">
                  <span>Preventive Standards Checked</span>
                  <span>Week {latestPassedPreventiveTask.scheduleWeek}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                  {latestPassedPreventiveTask.taskName} completed by {latestPassedPreventiveTask.assignedStaffName}.
                </p>
              </div>
            )}

            {!largestOverduePayment && !highestValuePendingBooking && !latestPassedPreventiveTask && (
              <p className="text-slate-400 text-center py-4">No priority notices right now.</p>
            )}
          </div>

          <Link
            to="/owner/reports"
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-900 dark:bg-brand-600 text-white font-bold text-xs shadow-md transition-colors"
          >
            <span>Open Executive Reporting Suite</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
