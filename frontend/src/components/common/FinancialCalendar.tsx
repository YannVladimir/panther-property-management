import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Receipt,
  AlertCircle,
  CheckCircle2,
  Clock,
  Building,
  Filter,
  Eye,
  ArrowUpRight,
  Zap,
  Droplets,
  Wifi,
  Shield,
  Trash2,
  Wrench,
  Sparkles,
} from 'lucide-react';
import { Badge } from './Badge';
import { Modal } from './Modal';
import { Payment, RecurringBill, Expense } from '../../types';

interface FinancialCalendarProps {
  payments: Payment[];
  recurringBills: RecurringBill[];
  expenses?: Expense[];
  onMarkBillPaid?: (billId: string) => void;
  variant?: 'operations' | 'owner';
  className?: string;
}

type CalendarFilter = 'all' | 'payments' | 'bills' | 'pending';
type CalendarViewMode = 'month' | 'agenda';

interface CalendarEvent {
  id: string;
  type: 'payment' | 'bill' | 'expense';
  subType: string;
  title: string;
  subtitle: string;
  amount: number;
  date: string; // YYYY-MM-DD
  status: 'paid' | 'pending' | 'overdue' | 'upcoming' | 'cancelled';
  category: string;
  propertyName?: string;
  unitNumber?: string;
  method?: string;
  reference?: string;
  rawItem: any;
}

export const FinancialCalendar: React.FC<FinancialCalendarProps> = ({
  payments,
  recurringBills,
  expenses = [],
  onMarkBillPaid,
  variant = 'operations',
  className = '',
}) => {
  // Default to August 2026 (matching mock data timeline)
  const [currentDate, setCurrentDate] = useState(new Date(2026, 7, 1));
  const [activeFilter, setActiveFilter] = useState<CalendarFilter>('all');
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [selectedDate, setSelectedDate] = useState<string | null>('2026-08-01');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Navigate months
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date(2026, 7, 1)); // Jump to current demo anchor
    setSelectedDate('2026-08-01');
  };

  // Convert all domain items to normalized CalendarEvents
  const allEvents = useMemo(() => {
    const list: CalendarEvent[] = [];

    // 1. Inflow Payments
    payments.forEach((p) => {
      list.push({
        id: `pay-${p.id}`,
        type: 'payment',
        subType: p.type,
        title: `${p.clientName} (${p.type.toUpperCase()})`,
        subtitle: `${p.propertyName} • Unit ${p.roomNumber}`,
        amount: p.amount,
        date: p.dueDate || p.date,
        status: p.status,
        category: p.type === 'rent' ? 'Apartment Rent' : p.type === 'utility' ? 'Utility Bill' : 'Security Deposit',
        propertyName: p.propertyName,
        unitNumber: p.roomNumber,
        method: p.method,
        reference: p.reference || p.invoiceNumber,
        rawItem: p,
      });
    });

    // 2. Outflow Recurring Bills (RED)
    recurringBills.forEach((b) => {
      list.push({
        id: `bill-${b.id}`,
        type: 'bill',
        subType: b.category,
        title: `${b.name}`,
        subtitle: `${b.vendor} • ${b.propertyName}`,
        amount: b.amount,
        date: b.nextDueDate,
        status: b.status,
        category: b.category,
        propertyName: b.propertyName,
        rawItem: b,
      });
    });

    // 3. Operational Expenses
    expenses.forEach((e) => {
      list.push({
        id: `exp-${e.id}`,
        type: 'expense',
        subType: e.category,
        title: `${e.description}`,
        subtitle: `${e.vendor} • ${e.propertyName}`,
        amount: e.amount,
        date: e.date,
        status: e.status,
        category: e.category,
        propertyName: e.propertyName,
        rawItem: e,
      });
    });

    return list;
  }, [payments, recurringBills, expenses]);

  // Filter events
  const filteredEvents = useMemo(() => {
    return allEvents.filter((ev) => {
      if (activeFilter === 'payments' && ev.type !== 'payment') return false;
      if (activeFilter === 'bills' && (ev.type !== 'bill' && ev.type !== 'expense')) return false;
      if (activeFilter === 'pending' && ev.status === 'paid') return false;
      return true;
    });
  }, [allEvents, activeFilter]);

  // Monthly aggregated totals
  const currentMonthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthEvents = filteredEvents.filter((ev) => ev.date.startsWith(currentMonthKey));

  const totalMonthlyCollections = monthEvents
    .filter((e) => e.type === 'payment')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalMonthlyBills = monthEvents
    .filter((e) => e.type === 'bill' || e.type === 'expense')
    .reduce((sum, e) => sum + e.amount, 0);

  const netCashFlow = totalMonthlyCollections - totalMonthlyBills;

  // Calendar Day Generation
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sunday

  const daysArray = useMemo(() => {
    const arr: { dayNum: number; dateStr: string; isCurrentMonth: boolean; events: CalendarEvent[] }[] = [];

    // Previous month padding days
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const prevMonth = month === 0 ? 12 : month;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      arr.push({
        dayNum: d,
        dateStr,
        isCurrentMonth: false,
        events: filteredEvents.filter((e) => e.date === dateStr),
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      arr.push({
        dayNum: d,
        dateStr,
        isCurrentMonth: true,
        events: filteredEvents.filter((e) => e.date === dateStr),
      });
    }

    // Next month padding days to complete 35 or 42 grid slots
    const remaining = (7 - (arr.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextMonth = month === 11 ? 1 : month + 2;
      const nextYear = month === 11 ? year + 1 : year;
      const dateStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      arr.push({
        dayNum: d,
        dateStr,
        isCurrentMonth: false,
        events: filteredEvents.filter((e) => e.date === dateStr),
      });
    }

    return arr;
  }, [year, month, daysInMonth, firstDayIndex, filteredEvents]);

  // Selected date events
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    return filteredEvents.filter((e) => e.date === selectedDate);
  }, [selectedDate, filteredEvents]);

  // Utility to render event pill
  const renderEventPill = (event: CalendarEvent) => {
    if (event.type === 'bill' || event.type === 'expense') {
      // RED COLOR FOR BILLS / EXPENSES
      return (
        <div
          key={event.id}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedEvent(event);
          }}
          className="group flex items-center justify-between gap-1 px-1.5 py-0.5 rounded-lg text-[10px] font-bold bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-all cursor-pointer truncate shadow-2xs"
          title={`${event.title} — $${event.amount.toLocaleString()} (${event.status})`}
        >
          <span className="flex items-center gap-1 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
            <span className="truncate">{event.title}</span>
          </span>
          <span className="font-mono text-[9px] text-rose-800 dark:text-rose-200 shrink-0 font-extrabold">
            -${event.amount >= 1000 ? `${(event.amount / 1000).toFixed(1)}k` : event.amount}
          </span>
        </div>
      );
    }

    // OTHER COLORS FOR PAYMENTS
    if (event.subType === 'rent') {
      // Emerald / Green for Rent
      return (
        <div
          key={event.id}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedEvent(event);
          }}
          className="group flex items-center justify-between gap-1 px-1.5 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all cursor-pointer truncate shadow-2xs"
          title={`${event.title} — $${event.amount.toLocaleString()} (${event.status})`}
        >
          <span className="flex items-center gap-1 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="truncate">{event.title}</span>
          </span>
          <span className="font-mono text-[9px] text-emerald-800 dark:text-emerald-200 shrink-0 font-extrabold">
            +${event.amount >= 1000 ? `${(event.amount / 1000).toFixed(1)}k` : event.amount}
          </span>
        </div>
      );
    }

    if (event.subType === 'deposit') {
      // Purple for Security Deposits
      return (
        <div
          key={event.id}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedEvent(event);
          }}
          className="group flex items-center justify-between gap-1 px-1.5 py-0.5 rounded-lg text-[10px] font-bold bg-purple-50 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-800/80 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-all cursor-pointer truncate shadow-2xs"
          title={`${event.title} — $${event.amount.toLocaleString()} (${event.status})`}
        >
          <span className="flex items-center gap-1 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
            <span className="truncate">{event.title}</span>
          </span>
          <span className="font-mono text-[9px] text-purple-800 dark:text-purple-200 shrink-0 font-extrabold">
            +${event.amount}
          </span>
        </div>
      );
    }

    // Blue / Cyan for Utilities & Water
    return (
      <div
        key={event.id}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedEvent(event);
        }}
        className="group flex items-center justify-between gap-1 px-1.5 py-0.5 rounded-lg text-[10px] font-bold bg-sky-50 dark:bg-sky-950/70 border border-sky-200 dark:border-sky-800/80 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 transition-all cursor-pointer truncate shadow-2xs"
        title={`${event.title} — $${event.amount.toLocaleString()} (${event.status})`}
      >
        <span className="flex items-center gap-1 truncate">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
          <span className="truncate">{event.title}</span>
        </span>
        <span className="font-mono text-[9px] text-sky-800 dark:text-sky-200 shrink-0 font-extrabold">
          +${event.amount}
        </span>
      </div>
    );
  };

  return (
    <div className={`glass-card rounded-3xl p-6 sm:p-7 shadow-soft space-y-6 border ${className}`}>
      {/* Calendar Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold font-display text-slate-900 dark:text-white flex items-center gap-2">
                <span>{monthNames[month]} {year}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-bold border border-brand-200 dark:border-brand-800">
                  Financial Schedule
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Track scheduled rent collections, tenant settlements, and utility standing charges.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Month Stepper */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-brand-600 transition-colors"
            >
              Today
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === 'month'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Month View
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === 'agenda'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Agenda List
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metric Strip & Color Legend */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-extrabold text-emerald-800 dark:text-emerald-300 tracking-wider">
              🟢 Expected Inflow (Rent & Deposits)
            </span>
            <p className="text-xl font-black font-display text-emerald-600 dark:text-emerald-400 mt-0.5">
              +${totalMonthlyCollections.toLocaleString()}
            </p>
          </div>
          <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-extrabold text-rose-800 dark:text-rose-300 tracking-wider">
              🔴 Outflows & Standing Bills
            </span>
            <p className="text-xl font-black font-display text-rose-600 dark:text-rose-400 mt-0.5">
              -${totalMonthlyBills.toLocaleString()}
            </p>
          </div>
          <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-brand-50/70 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-extrabold text-brand-800 dark:text-brand-300 tracking-wider">
              Projected Net Margin
            </span>
            <p className="text-xl font-black font-display text-brand-600 dark:text-brand-400 mt-0.5">
              ${netCashFlow.toLocaleString()}
            </p>
          </div>
          <div className="p-2 rounded-xl bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition-all ${
              activeFilter === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All Items
          </button>
          <button
            onClick={() => setActiveFilter('payments')}
            className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition-all ${
              activeFilter === 'payments'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950'
            }`}
          >
            🟢 Payments Only
          </button>
          <button
            onClick={() => setActiveFilter('bills')}
            className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition-all ${
              activeFilter === 'bills'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-950'
            }`}
          >
            🔴 Bills (Red)
          </button>
          <button
            onClick={() => setActiveFilter('pending')}
            className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition-all ${
              activeFilter === 'pending'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950'
            }`}
          >
            ⚠️ Due / Pending
          </button>
        </div>
      </div>

      {/* Main Calendar View Area */}
      {viewMode === 'month' ? (
        <div className="space-y-3">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[11px] font-extrabold uppercase text-slate-400 dark:text-slate-500 py-1">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Month Days Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {daysArray.map((day, idx) => {
              const isSelected = selectedDate === day.dateStr;
              const hasEvents = day.events.length > 0;
              const hasBills = day.events.some((e) => e.type === 'bill' || e.type === 'expense');
              const hasPayments = day.events.some((e) => e.type === 'payment');

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDate(day.dateStr)}
                  className={`min-h-[105px] sm:min-h-[120px] p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    !day.isCurrentMonth
                      ? 'opacity-35 bg-slate-50/40 dark:bg-slate-900/20 border-slate-100 dark:border-slate-800'
                      : isSelected
                      ? 'ring-2 ring-brand-500 bg-brand-50/30 dark:bg-brand-950/40 border-brand-400 shadow-sm'
                      : 'glass-card hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {/* Day header */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                        isSelected
                          ? 'bg-brand-600 text-white'
                          : day.dateStr === '2026-08-17'
                          ? 'bg-amber-500 text-white'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {day.dayNum}
                    </span>

                    {/* Dot indicators for quick identification */}
                    {hasEvents && (
                      <div className="flex items-center gap-1">
                        {hasPayments && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Payment Event" />}
                        {hasBills && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" title="Outflow Bill" />}
                        <span className="text-[9px] font-mono font-bold text-slate-400">
                          {day.events.length}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Day Event Pills */}
                  <div className="space-y-1 my-1 overflow-hidden">
                    {day.events.slice(0, 2).map((ev) => renderEventPill(ev))}
                    {day.events.length > 2 && (
                      <span className="block text-[9px] font-bold text-slate-400 hover:text-brand-600 transition-colors pl-1">
                        +{day.events.length - 2} more items...
                      </span>
                    )}
                  </div>

                  {/* Bottom Day Total Footprint */}
                  {hasEvents && (
                    <div className="text-[9px] text-slate-400 font-mono flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-0.5">
                      <span className="truncate">Active</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {day.events.length} {day.events.length === 1 ? 'entry' : 'entries'}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Agenda / Timeline List View */
        <div className="space-y-3">
          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-400 uppercase font-bold text-[10px] border-b">
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Category & Title</th>
                  <th className="py-3 px-4">Entity / Estate</th>
                  <th className="py-3 px-4">Flow Type</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {monthEvents.map((ev) => (
                  <tr
                    key={ev.id}
                    onClick={() => setSelectedEvent(ev)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold">{ev.date}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {ev.title}
                    </td>
                    <td className="py-3 px-4">{ev.subtitle}</td>
                    <td className="py-3 px-4">
                      {ev.type === 'bill' || ev.type === 'expense' ? (
                        <span className="inline-flex items-center gap-1 font-bold text-rose-600 dark:text-rose-400">
                          🔴 Bill / Expense
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                          🟢 Inflow Payment
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-extrabold font-mono">
                      {ev.type === 'bill' || ev.type === 'expense' ? (
                        <span className="text-rose-600 dark:text-rose-400">-${ev.amount.toLocaleString()}</span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400">+${ev.amount.toLocaleString()}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          ev.status === 'paid'
                            ? 'success'
                            : ev.status === 'upcoming'
                            ? 'info'
                            : ev.status === 'pending'
                            ? 'warning'
                            : 'danger'
                        }
                        size="sm"
                        dot
                      >
                        {ev.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button className="text-xs font-bold text-brand-600 hover:underline">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Selected Day Expanded Drawer / Inspector */}
      {selectedDate && selectedDateEvents.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-700">
            <div>
              <span className="text-[10px] uppercase font-bold text-brand-600 dark:text-brand-400 tracking-wider">
                Date Breakdown
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Scheduled Transactions for {selectedDate} ({selectedDateEvents.length} items)
              </h3>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                +${selectedDateEvents.filter((e) => e.type === 'payment').reduce((a, b) => a + b.amount, 0).toLocaleString()} Collections
              </span>
              <span className="text-rose-600 dark:text-rose-400 font-bold">
                -${selectedDateEvents.filter((e) => e.type === 'bill' || e.type === 'expense').reduce((a, b) => a + b.amount, 0).toLocaleString()} Bills
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {selectedDateEvents.map((ev) => (
              <div
                key={ev.id}
                onClick={() => setSelectedEvent(ev)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer hover:shadow-md flex flex-col justify-between space-y-2 ${
                  ev.type === 'bill' || ev.type === 'expense'
                    ? 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/80 hover:border-rose-400'
                    : 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/80 hover:border-emerald-400'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className={`text-[10px] uppercase font-extrabold ${ev.type === 'bill' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {ev.type === 'bill' ? '🔴 Outflow Bill' : '🟢 Resident Payment'}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                      {ev.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{ev.subtitle}</p>
                  </div>
                  <Badge
                    variant={ev.status === 'paid' ? 'success' : ev.status === 'upcoming' ? 'info' : 'warning'}
                    size="sm"
                  >
                    {ev.status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800 text-xs">
                  <span className="text-[11px] text-slate-400">{ev.category}</span>
                  <span className={`font-mono font-extrabold ${ev.type === 'bill' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {ev.type === 'bill' ? '-' : '+'}${ev.amount.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Single Event Detail Popover Modal */}
      {selectedEvent && (
        <Modal
          isOpen={Boolean(selectedEvent)}
          onClose={() => setSelectedEvent(null)}
          title={selectedEvent.title}
          subtitle={`${selectedEvent.category} • Scheduled Date: ${selectedEvent.date}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 uppercase font-bold text-[10px]">Transaction Type</span>
                <Badge variant={selectedEvent.type === 'bill' ? 'danger' : 'success'} size="sm">
                  {selectedEvent.type === 'bill' ? 'RED OUTFLOW BILL' : 'INFLOW PAYMENT'}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Total Transaction Amount</span>
                <span className={`text-lg font-mono font-extrabold ${selectedEvent.type === 'bill' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {selectedEvent.type === 'bill' ? '-' : '+'}${selectedEvent.amount.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Status</span>
                <Badge variant={selectedEvent.status === 'paid' ? 'success' : 'warning'} size="sm" dot>
                  {selectedEvent.status.toUpperCase()}
                </Badge>
              </div>

              {selectedEvent.propertyName && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Property / Estate</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{selectedEvent.propertyName}</span>
                </div>
              )}

              {selectedEvent.unitNumber && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Assigned Suite</span>
                  <span className="font-bold text-brand-600 dark:text-brand-400">Unit {selectedEvent.unitNumber}</span>
                </div>
              )}

              {selectedEvent.reference && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Reference / Invoice</span>
                  <span className="font-mono text-[11px]">{selectedEvent.reference}</span>
                </div>
              )}
            </div>

            {selectedEvent.type === 'bill' && onMarkBillPaid && selectedEvent.status !== 'paid' && (
              <button
                onClick={() => {
                  onMarkBillPaid(selectedEvent.rawItem.id);
                  setSelectedEvent(null);
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors"
              >
                Mark Bill as Paid
              </button>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
