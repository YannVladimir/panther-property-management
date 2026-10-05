import React, { useState, useMemo, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { useRecurringBillsQuery, useCreateRecurringBillMutation, useAddBillPaymentMutation } from '../../api/recurringBills';
import { usePropertiesQuery } from '../../api/properties';
import {
  Repeat,
  Calendar as CalendarIcon,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building,
  Plus,
  Shield,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  Flame,
  Wifi,
  Droplets,
  Wrench,
  Trash2,
  Check,
  CreditCard,
  History,
  Upload,
  ReceiptText,
  Banknote,
  FileText,
  Hash,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Pagination } from '../../components/common/Pagination';
import { RecurringBill, BillPayment } from '../../types';

/* ───────────── helpers ───────────── */
const getCategoryIcon = (category: RecurringBill['category'], cls = 'w-3.5 h-3.5') => {
  switch (category) {
    case 'Electricity':      return <Flame   className={`${cls} text-amber-500`} />;
    case 'Water':            return <Droplets className={`${cls} text-sky-500`} />;
    case 'Internet':         return <Wifi    className={`${cls} text-indigo-500`} />;
    case 'Security':         return <Shield  className={`${cls} text-emerald-500`} />;
    case 'Garbage Collection': return <Trash2 className={`${cls} text-teal-500`} />;
    default:                 return <Wrench  className={`${cls} text-purple-500`} />;
  }
};

const categoryColor = (category: RecurringBill['category']) => {
  switch (category) {
    case 'Electricity':        return 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    case 'Water':              return 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800';
    case 'Internet':           return 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
    case 'Security':           return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    case 'Garbage Collection': return 'bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800';
    default:                   return 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
  }
};

const CategoryPill = ({ category }: { category: RecurringBill['category'] }) => (
  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[9px] font-extrabold leading-none ${categoryColor(category)}`}>
    {getCategoryIcon(category, 'w-2.5 h-2.5')}
    {category}
  </span>
);

/* ───────────────────────────────── */

export const RecurringBillsPage: React.FC = () => {
  const recurringBillsQuery = useRecurringBillsQuery();
  const propertiesQuery = usePropertiesQuery();
  const createRecurringBillMutation = useCreateRecurringBillMutation();
  const addBillPaymentMutation = useAddBillPaymentMutation();
  const { success, error } = useToast();

  const recurringBills = recurringBillsQuery.data ?? [];
  const properties = propertiesQuery.data ?? [];
  const isLoading = recurringBillsQuery.isLoading || propertiesQuery.isLoading;

  /* Calendar state */
  const [currentYear, setCurrentYear]   = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(7);
  const [selectedDate, setSelectedDate] = useState<string | null>('2026-08-14');

  /* Table filters */
  const [searchQuery, setSearchQuery]     = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter]   = useState('all');
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* Add-bill drawer */
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [newName, setNewName]             = useState('');
  const [newPropertyId, setNewPropertyId] = useState('');
  const [newCategory, setNewCategory]     = useState<RecurringBill['category']>('Electricity');
  const [newVendor, setNewVendor]         = useState('');
  const [newAmount, setNewAmount]         = useState<number>(500);
  const [newFrequency, setNewFrequency]   = useState<RecurringBill['frequency']>('Monthly');
  const [newNextDueDate, setNewNextDueDate] = useState('2026-08-30');
  const [newAutoRenew, setNewAutoRenew]   = useState(true);
  const [newReminderDays, setNewReminderDays] = useState(5);

  useEffect(() => {
    if (!newPropertyId && properties.length > 0) setNewPropertyId(properties[0].id);
  }, [properties, newPropertyId]);

  /* Payment panel (slide-in) */
  const [payPanelBillId, setPayPanelBillId] = useState<string | null>(null);
  const [payAmount, setPayAmount]     = useState<number>(0);
  const [payDate, setPayDate]         = useState(new Date().toISOString().slice(0, 10));
  const [payMethod, setPayMethod]     = useState<BillPayment['method']>('Mobile Money');
  const [payRef, setPayRef]           = useState('');
  const [payNotes, setPayNotes]       = useState('');
  const [payProof, setPayProof]       = useState<string | null>(null);
  const [payTab, setPayTab]           = useState<'record' | 'history'>('record');

  const activeBill = payPanelBillId ? recurringBills.find((b) => b.id === payPanelBillId) : null;

  const openPayPanel = (bill: RecurringBill) => {
    setPayPanelBillId(bill.id);
    setPayAmount(bill.amount);
    setPayDate(new Date().toISOString().slice(0, 10));
    setPayMethod('Mobile Money');
    setPayRef('');
    setPayNotes('');
    setPayProof(null);
    setPayTab('record');
  };

  const closePayPanel = () => setPayPanelBillId(null);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBill) return;
    if (!payRef.trim()) { error('Reference Required', 'Please enter a transaction reference number.'); return; }
    try {
      await addBillPaymentMutation.mutateAsync({
        billId: activeBill.id,
        input: {
          paidDate: payDate,
          amount: payAmount,
          method: payMethod,
          reference: payRef.trim(),
          notes: payNotes.trim() || undefined,
          proofUrl: payProof || undefined,
        },
      });
      success('Payment Recorded', `$${payAmount} payment for ${activeBill.name} has been logged.`);
      setPayTab('history');
      setPayRef('');
      setPayNotes('');
      setPayProof(null);
    } catch {
      error('Recording Failed', 'Could not record this payment. Please try again.');
    }
  };

  /* Stats */
  const totalMonthlyCommitment = recurringBills.reduce((acc, b) => acc + b.amount, 0);
  const upcomingBills = recurringBills.filter((b) => b.status === 'upcoming');
  const overdueBills  = recurringBills.filter((b) => b.status === 'overdue');
  const paidBills     = recurringBills.filter((b) => b.status === 'paid');
  const totalUpcomingAmount = upcomingBills.reduce((acc, b) => acc + b.amount, 0);
  const totalOverdueAmount  = overdueBills.reduce((acc, b) => acc + b.amount, 0);

  /* Calendar */
  const daysInMonth   = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const prevMonth = () => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y=>y-1); } else setCurrentMonth(m=>m-1); };
  const nextMonth = () => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y=>y+1); } else setCurrentMonth(m=>m+1); };

  const getBillsForDate = (d: string) => recurringBills.filter((b) => b.nextDueDate === d);
  const selectedDateBills = selectedDate ? getBillsForDate(selectedDate) : [];

  /* Table filter */
  const filteredBills = useMemo(() => recurringBills.filter((b) => {
    if (categoryFilter !== 'all' && b.category !== categoryFilter) return false;
    if (statusFilter   !== 'all' && b.status   !== statusFilter)   return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return b.name.toLowerCase().includes(q) || b.vendor.toLowerCase().includes(q) || b.propertyName.toLowerCase().includes(q);
    }
    return true;
  }), [recurringBills, categoryFilter, statusFilter, searchQuery]);

  const pagedBills = useMemo(() => {
    const start = (pageIndex - 1) * pageSize;
    return filteredBills.slice(start, start + pageSize);
  }, [filteredBills, pageIndex, pageSize]);

  /* Add bill */
  const handleAddBillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newVendor.trim()) { error('Validation Error', 'Please provide a bill title and vendor.'); return; }
    const prop = properties.find((p) => p.id === newPropertyId) || properties[0];
    if (!prop) return;
    try {
      await createRecurringBillMutation.mutateAsync({
        propertyId: prop.id,
        name: newName.trim(),
        category: newCategory,
        vendor: newVendor.trim(),
        amount: Number(newAmount),
        frequency: newFrequency,
        nextDueDate: newNextDueDate,
        status: 'upcoming',
        autoRenew: newAutoRenew,
        reminderDays: Number(newReminderDays),
      });
      success('Recurring Contract Added', `Added ${newName} ($${newAmount}/${newFrequency}) for ${prop.name}.`);
      setAddDrawerOpen(false);
      setNewName(''); setNewVendor('');
    } catch {
      error('Creation Failed', 'Could not add this recurring bill. Please try again.');
    }
  };

  if (isLoading) {
    return <div className="py-24 text-center text-sm text-slate-400">Loading recurring bills…</div>;
  }

  /* ─── render ─── */
  return (
    <div className="space-y-8 pb-16">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 px-2.5 py-1 rounded-full border border-brand-200 dark:border-brand-800 mb-1">
            <Repeat className="w-3.5 h-3.5" />
            <span>Utility Contracts & Standing Charges</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 dark:text-white">
            Recurring Bills & Service SLA Contracts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Monitor EUCL power, WASAC water feeds, Liquid Fiber, 24/7 security, and elevator maintenance.
          </p>
        </div>
        <button
          onClick={() => setAddDrawerOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md hover:shadow-glow transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Recurring Bill</span>
        </button>
      </div>

      {/* ── 3-col Stats  +  Calendar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* LEFT: 4 stacked KPI cards */}
        <div className="lg:col-span-4 flex flex-col gap-4">

          {/* Total Count */}
          <div className="glass-card p-5 rounded-3xl border shadow-soft space-y-1.5">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
              <span>Total Registered Bills</span>
              <Hash className="w-4 h-4 text-brand-500" />
            </div>
            <p className="text-3xl font-extrabold font-display text-slate-900 dark:text-white">
              {recurringBills.length}
            </p>
            <p className="text-xs text-slate-500">Active standing utility contracts &amp; SLAs</p>
          </div>

          {/* Monthly Commitment */}
          <div className="glass-card p-5 rounded-3xl border shadow-soft space-y-1.5">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
              <span>Monthly Commitment</span>
              <DollarSign className="w-4 h-4 text-brand-500" />
            </div>
            <p className="text-3xl font-extrabold font-display text-slate-900 dark:text-white">
              ${totalMonthlyCommitment.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500">Combined standing charges per cycle</p>
          </div>

          {/* Upcoming */}
          <div className="glass-card p-5 rounded-3xl border shadow-soft space-y-1.5">
            <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 text-xs font-bold uppercase">
              <span>Upcoming Due</span>
              <Clock className="w-4 h-4" />
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-extrabold font-display text-amber-500">${totalUpcomingAmount.toLocaleString()}</p>
              <Badge variant="warning" size="sm">{upcomingBills.length} bills</Badge>
            </div>
            <p className="text-xs text-slate-500">Scheduled for this billing cycle</p>
          </div>

          {/* Overdue */}
          <div className="glass-card p-5 rounded-3xl border shadow-soft space-y-1.5">
            <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 text-xs font-bold uppercase">
              <span>Overdue Notice</span>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-extrabold font-display text-rose-600 dark:text-rose-400">${totalOverdueAmount.toLocaleString()}</p>
              <Badge variant="danger" size="sm">{overdueBills.length} overdue</Badge>
            </div>
            <p className="text-xs text-rose-500 font-semibold">Immediate settlement required</p>
          </div>
        </div>

        {/* RIGHT: Interactive calendar */}
        <div className="lg:col-span-8 glass-card p-6 sm:p-7 rounded-3xl border shadow-soft space-y-4">
          {/* Calendar Controls */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              <h2 className="text-lg font-extrabold font-display text-slate-900 dark:text-white">
                {monthNames[currentMonth]} {currentYear}
              </h2>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={prevMonth} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition-colors" aria-label="Previous">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => { setCurrentMonth(7); setCurrentYear(2026); }} className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors">
                Current Cycle
              </button>
              <button onClick={nextMonth} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition-colors" aria-label="Next">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
              <div key={d} className="py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{d}</div>
            ))}

            {/* Empty leading cells */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`e${i}`} className="h-[72px] rounded-xl bg-slate-50/40 dark:bg-slate-800/20" />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day     = idx + 1;
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
              const dayBills = getBillsForDate(dateStr);
              const isSelected = selectedDate === dateStr;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`h-[72px] p-1.5 rounded-2xl flex flex-col gap-0.5 text-left transition-all border overflow-hidden ${
                    isSelected
                      ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-950/60 ring-2 ring-brand-500 shadow-xs'
                      : dayBills.length > 0
                      ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:border-slate-400'
                      : 'border-transparent bg-slate-50/60 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <span className={`text-[11px] font-bold block ${isSelected ? 'text-brand-600 dark:text-brand-400' : 'text-slate-700 dark:text-slate-300'}`}>
                    {day}
                  </span>

                  {/* Category pills — stacked, one per bill, like the dashboard */}
                  <div className="flex flex-col gap-0.5 w-full overflow-hidden">
                    {dayBills.map((bill) => (
                      <span
                        key={bill.id}
                        className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded border text-[8px] font-extrabold leading-none truncate max-w-full ${
                          bill.status === 'overdue'
                            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700'
                            : bill.status === 'paid'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                            : categoryColor(bill.category)
                        }`}
                      >
                        {getCategoryIcon(bill.category, 'w-2 h-2 shrink-0')}
                        <span className="truncate">{bill.category}</span>
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 gap-2">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"/><strong className="text-slate-700 dark:text-slate-300 font-bold">Overdue</strong></span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"/><strong className="text-slate-700 dark:text-slate-300 font-bold">Upcoming</strong></span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"/><strong className="text-slate-700 dark:text-slate-300 font-bold">Paid</strong></span>
            </div>
            <span className="text-[10px] text-slate-400 italic">Click a date to view bills due that day</span>
          </div>
        </div>
      </div>

      {/* ── Selected-date bill cards ── */}
      {selectedDate && (
        <div className="glass-card p-6 sm:p-7 rounded-3xl border shadow-soft space-y-4 bg-gradient-to-br from-brand-500/5 via-transparent to-transparent">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              <h3 className="text-base font-extrabold font-display text-slate-900 dark:text-white">
                Bills on {selectedDate} ({selectedDateBills.length})
              </h3>
            </div>
            <button onClick={() => setSelectedDate(null)} className="text-xs font-bold text-slate-400 hover:text-slate-700 dark:hover:text-white">Dismiss</button>
          </div>

          {selectedDateBills.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-1.5"/>
              <p className="font-semibold">No utility bills scheduled for {selectedDate}.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedDateBills.map((bill) => (
                <div key={bill.id} className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <CategoryPill category={bill.category} />
                      <Badge variant={bill.status === 'paid' ? 'success' : bill.status === 'upcoming' ? 'warning' : 'danger'} size="sm" dot>{bill.status.toUpperCase()}</Badge>
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{bill.name}</h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Building className="w-3.5 h-3.5 text-brand-500"/>{bill.propertyName}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border text-xs space-y-1">
                      <div className="flex justify-between"><span className="text-slate-400">Vendor:</span><span className="font-bold text-slate-800 dark:text-slate-200">{bill.vendor}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Frequency:</span><span className="font-semibold">{bill.frequency}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Auto-Renew:</span><span className="font-bold text-emerald-600">{bill.autoRenew ? 'Yes' : 'No'}</span></div>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Standing Charge</span>
                      <p className="text-xl font-extrabold font-mono text-slate-900 dark:text-white">${bill.amount}</p>
                    </div>
                    {bill.status !== 'paid' ? (
                      <button onClick={() => openPayPanel(bill)} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5"/><span>Record Payment</span>
                      </button>
                    ) : (
                      <button onClick={() => openPayPanel(bill)} className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5">
                        <History className="w-3.5 h-3.5"/><span>Payment History</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Master Table ── */}
      <div className="space-y-4">
        {/* Filter bar */}
        <div className="glass-card p-4 rounded-2xl shadow-soft flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3"/>
            <input type="text" placeholder="Search by contract title, vendor, or property…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-brand-500"/>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold">
              <option value="all">All Categories</option>
              <option value="Electricity">Electricity</option>
              <option value="Water">Water</option>
              <option value="Internet">Internet</option>
              <option value="Security">Security</option>
              <option value="Maintenance Contract">Maintenance Contract</option>
              <option value="Garbage Collection">Garbage Collection</option>
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold">
              <option value="all">All Statuses</option>
              <option value="upcoming">Upcoming</option>
              <option value="overdue">Overdue</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="glass-card rounded-3xl shadow-soft overflow-hidden border">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
              All Recurring Contracts &amp; Utility Accounts ({filteredBills.length})
            </h3>
            <span className="text-xs text-slate-400">${totalMonthlyCommitment.toLocaleString()} / month total</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold text-[10px] bg-slate-50/50 dark:bg-slate-800/30">
                  <th className="py-3.5 px-6">Contract Title</th>
                  <th className="py-3.5 px-4">Estate</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Vendor</th>
                  <th className="py-3.5 px-4">Frequency</th>
                  <th className="py-3.5 px-4">Next Due</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Payments</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredBills.length === 0 && (
                  <tr><td colSpan={10} className="py-12 text-center text-slate-400 font-semibold">No recurring contracts match your filters.</td></tr>
                )}
                {pagedBills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">{bill.name}</td>
                    <td className="py-4 px-4 font-medium text-slate-700 dark:text-slate-300">{bill.propertyName}</td>
                    <td className="py-4 px-4">
                      <CategoryPill category={bill.category} />
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-800 dark:text-slate-200">{bill.vendor}</td>
                    <td className="py-4 px-4 text-slate-500 font-medium">{bill.frequency}</td>
                    <td className="py-4 px-4 font-bold text-brand-600 dark:text-brand-400 font-mono">{bill.nextDueDate}</td>
                    <td className="py-4 px-4 font-extrabold text-slate-900 dark:text-white font-mono text-sm">${bill.amount}</td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => { openPayPanel(bill); setPayTab('history'); }}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                      >
                        <ReceiptText className="w-3.5 h-3.5"/>
                        <span>{(bill.payments || []).length} records</span>
                      </button>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant={bill.status === 'paid' ? 'success' : bill.status === 'upcoming' ? 'warning' : 'danger'} size="sm" dot>
                        {bill.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => openPayPanel(bill)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs transition-all inline-flex items-center gap-1 ${
                          bill.status !== 'paid'
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {bill.status !== 'paid' ? <><CreditCard className="w-3.5 h-3.5"/><span>Pay</span></> : <><History className="w-3.5 h-3.5"/><span>History</span></>}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={pageIndex}
            totalItems={filteredBills.length}
            pageSize={pageSize}
            onPageChange={(p) => setPageIndex(p)}
            onPageSizeChange={(s) => { setPageSize(s); setPageIndex(1); }}
          />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* PAYMENT SIDE PANEL                                                   */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div
        className={`fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300 ${activeBill ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={closePayPanel}
      />
      <aside className={`fixed right-0 top-0 h-full z-50 w-full max-w-lg bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out ${activeBill ? 'translate-x-0' : 'translate-x-full'}`}>
        {activeBill && (
          <>
            {/* Panel header */}
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <CategoryPill category={activeBill.category}/>
                  <Badge variant={activeBill.status === 'paid' ? 'success' : activeBill.status === 'upcoming' ? 'warning' : 'danger'} size="sm" dot>{activeBill.status.toUpperCase()}</Badge>
                </div>
                <h2 className="text-base font-extrabold font-display text-slate-900 dark:text-white leading-tight">{activeBill.name}</h2>
                <p className="text-xs text-slate-500 flex items-center gap-1"><Building className="w-3.5 h-3.5 text-brand-500"/>{activeBill.propertyName} · <span className="font-bold">{activeBill.vendor}</span></p>
              </div>
              <button onClick={closePayPanel} className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors shrink-0"><X className="w-5 h-5"/></button>
            </div>

            {/* Standing-amount strip */}
            <div className="px-6 py-3 bg-gradient-to-r from-brand-600/10 to-transparent border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold text-slate-400">Standing Charge</span>
              <span className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white">${activeBill.amount}<span className="text-sm text-slate-400 font-bold"> / {activeBill.frequency}</span></span>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              {(['record','history'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setPayTab(t)}
                  className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${
                    payTab === t
                      ? 'border-b-2 border-brand-600 text-brand-600 dark:text-brand-400'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  {t === 'record' ? <span className="flex items-center justify-center gap-1.5"><CreditCard className="w-3.5 h-3.5"/>Record Payment</span> : <span className="flex items-center justify-center gap-1.5"><History className="w-3.5 h-3.5"/>Payment History ({(activeBill.payments || []).length})</span>}
                </button>
              ))}
            </div>

            {/* TAB: Record Payment */}
            {payTab === 'record' && (
              <form onSubmit={handleRecordPayment} className="flex-1 overflow-y-auto px-6 py-5 space-y-4 text-xs">
                <div className="space-y-3">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Payment Transaction Particulars *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-1">Payment Date *</label>
                      <input type="date" required value={payDate} onChange={(e) => setPayDate(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"/>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-1">Amount Paid (USD) *</label>
                      <input type="number" required value={payAmount} onChange={(e) => setPayAmount(Number(e.target.value))} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-extrabold text-emerald-600 font-mono text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"/>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1">Payment Method *</label>
                    <select value={payMethod} onChange={(e) => setPayMethod(e.target.value as any)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all">
                      <option value="Mobile Money">Mobile Money (MTN / Airtel)</option>
                      <option value="Bank Transfer">Bank Transfer (SWIFT / RWF)</option>
                      <option value="Cash">Cash Payment</option>
                      <option value="Cheque">Bank Cheque</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1">Transaction Reference / Receipt No. *</label>
                    <input type="text" required placeholder="e.g. MTN-2026-XXXX or BNK-TXN-00293" value={payRef} onChange={(e) => setPayRef(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"/>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1">Notes (optional)</label>
                    <textarea rows={2} placeholder="Any additional notes about this payment…" value={payNotes} onChange={(e) => setPayNotes(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white text-xs placeholder:text-slate-400 resize-none focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"/>
                  </div>
                </div>
                {/* Proof of payment upload */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="block text-[10px] text-slate-400 font-bold mb-1">Proof of Payment (receipt / screenshot)</label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setPayProof(file.name);
                      }}
                    />
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 border-dashed transition-colors ${payProof ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30' : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60'}`}>
                      <Upload className={`w-5 h-5 shrink-0 ${payProof ? 'text-emerald-500' : 'text-slate-400'}`}/>
                      {payProof
                        ? <span className="text-emerald-700 dark:text-emerald-300 font-bold truncate">{payProof}</span>
                        : <span className="text-slate-500">Click to upload receipt image or PDF</span>
                      }
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button type="submit" className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2">
                    <Check className="w-4 h-4"/>
                    <span>Save Payment Record</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB: Payment History */}
            {payTab === 'history' && (
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3 text-xs">
                {(activeBill.payments || []).length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <ReceiptText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2"/>
                    <p className="font-semibold">No payment records yet.</p>
                    <p className="text-[11px] mt-1">Switch to the <strong>Record Payment</strong> tab to log a settlement.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(activeBill.payments || []).map((pmt, i) => (
                      <div key={pmt.id} className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-bold text-[11px]">#{(activeBill.payments || []).length - i} — {pmt.paidDate}</span>
                          <span className="text-base font-extrabold font-mono text-emerald-600 dark:text-emerald-400">${pmt.amount}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-[11px]">
                          <div className="flex items-center gap-1 text-slate-500"><Banknote className="w-3.5 h-3.5 shrink-0"/><span>{pmt.method}</span></div>
                          <div className="flex items-center gap-1 text-slate-500"><FileText className="w-3.5 h-3.5 shrink-0"/><span className="font-mono font-bold text-slate-700 dark:text-slate-300 truncate">{pmt.reference}</span></div>
                        </div>
                        {pmt.notes && <p className="text-slate-500 italic text-[11px]">{pmt.notes}</p>}
                        {pmt.proofUrl && (
                          <div className="flex items-center gap-1.5 mt-1 px-2 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                            <Upload className="w-3.5 h-3.5 text-emerald-600 shrink-0"/>
                            <span className="text-emerald-700 dark:text-emerald-300 font-bold truncate">{pmt.proofUrl}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </aside>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ADD BILL DRAWER                                                       */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div className={`fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300 ${addDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setAddDrawerOpen(false)}/>
      <aside className={`fixed right-0 top-0 h-full z-50 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out ${addDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 text-brand-600 dark:text-brand-400 font-bold text-xs mb-0.5"><Plus className="w-3.5 h-3.5"/><span>Standing SLA & Contract</span></div>
            <h2 className="text-lg font-extrabold font-display text-slate-900 dark:text-white">Add New Recurring Bill</h2>
          </div>
          <button onClick={() => setAddDrawerOpen(false)} className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"><X className="w-5 h-5"/></button>
        </div>

        <form onSubmit={handleAddBillSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-4 text-xs">
          {/* Contract Overview */}
          <div className="space-y-3">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Contract & Service Scope *
            </label>
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">Bill / Contract Title *</label>
              <input type="text" required placeholder="e.g. Dedicated Leased Fiber Internet (1 Gbps)" value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"/>
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">Assigned Property *</label>
              <select value={newPropertyId} onChange={(e) => setNewPropertyId(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all">
                {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">Category *</label>
                <select value={newCategory} onChange={(e) => setNewCategory(e.target.value as any)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all">
                  <option value="Electricity">Electricity</option>
                  <option value="Water">Water</option>
                  <option value="Internet">Internet</option>
                  <option value="Security">Security</option>
                  <option value="Cleaning">Cleaning</option>
                  <option value="Maintenance Contract">Maintenance Contract</option>
                  <option value="Garbage Collection">Garbage Collection</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">Service Vendor *</label>
                <input type="text" required placeholder="e.g. Liquid Telecom" value={newVendor} onChange={(e) => setNewVendor(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"/>
              </div>
            </div>
          </div>

          {/* Pricing & Billing Cycle */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Financials & Schedule *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">Amount ($ USD) *</label>
                <input type="number" required value={newAmount} onChange={(e) => setNewAmount(Number(e.target.value))} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-extrabold text-emerald-600 font-mono text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"/>
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">Frequency *</label>
                <select value={newFrequency} onChange={(e) => setNewFrequency(e.target.value as any)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all">
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Bi-Weekly">Bi-Weekly</option>
                  <option value="Annual">Annual</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">Next Due Date *</label>
                <input type="date" required value={newNextDueDate} onChange={(e) => setNewNextDueDate(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"/>
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">Reminder (Days)</label>
                <input type="number" min={1} max={30} value={newReminderDays} onChange={(e) => setNewReminderDays(Number(e.target.value))} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"/>
              </div>
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border space-y-2">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={newAutoRenew} onChange={(e) => setNewAutoRenew(e.target.checked)} className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"/>
              <span className="font-bold text-slate-900 dark:text-white">Auto-Renew SLA Contract</span>
            </label>
            <p className="text-[11px] text-slate-500 leading-relaxed ml-6">Standing charge rolls over automatically each billing cycle upon settlement.</p>
          </div>
          <div className="pt-3">
            <button type="submit" className="w-full py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2">
              <Repeat className="w-4 h-4"/>
              <span>Save & Register Recurring Bill</span>
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
};
