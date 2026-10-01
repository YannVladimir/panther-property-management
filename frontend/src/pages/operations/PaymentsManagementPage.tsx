import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import confetti from 'canvas-confetti';
import {
  Receipt,
  DollarSign,
  Search,
  Filter,
  Plus,
  Printer,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Pagination } from '../../components/common/Pagination';
import { Modal } from '../../components/common/Modal';
import { Payment, PaymentType, PaymentMethod } from '../../types';

export const PaymentsManagementPage: React.FC = () => {
  const { payments, clients, properties, addPayment } = useData();
  const { success } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);

  // Form State for Recording Payment
  const [clientId, setClientId] = useState(clients[0]?.id || '');
  const [amount, setAmount] = useState(850);
  const [type, setType] = useState<PaymentType>('rent');
  const [method, setMethod] = useState<PaymentMethod>('Mobile Money');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  const selectedClientObj = clients.find((c) => c.id === clientId) || clients[0];

  // Financial Metrics
  const totalCollected = payments.filter((p) => p.status === 'paid').reduce((acc, p) => acc + p.amount, 0);
  const totalOutstanding = payments.filter((p) => p.status === 'pending' || p.status === 'overdue').reduce((acc, p) => acc + p.amount, 0);
  const overdueCount = payments.filter((p) => p.status === 'overdue').length;

  const filteredPayments = useMemo(() => payments.filter((p) => {
    if (typeFilter !== 'all' && p.type !== typeFilter) return false;
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.invoiceNumber.toLowerCase().includes(q) ||
        p.clientName.toLowerCase().includes(q) ||
        p.propertyName.toLowerCase().includes(q) ||
        p.reference.toLowerCase().includes(q)
      );
    }
    return true;
  }), [payments, typeFilter, statusFilter, searchQuery]);

  const pagedPayments = useMemo(() => {
    const start = (pageIndex - 1) * pageSize;
    return filteredPayments.slice(start, start + pageSize);
  }, [filteredPayments, pageIndex, pageSize]);

  const handleRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientObj) return;

    const newPayment = addPayment({
      clientId: selectedClientObj.id,
      clientName: selectedClientObj.name,
      clientAvatar: selectedClientObj.avatar,
      propertyId: selectedClientObj.currentPropertyId,
      propertyName: selectedClientObj.currentPropertyName,
      roomId: selectedClientObj.currentRoomId,
      roomNumber: selectedClientObj.currentRoomNumber,
      amount,
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      type,
      method,
      reference: reference || `REF-${Math.floor(100000 + Math.random() * 900000)}`,
      status: 'paid',
      notes,
    });

    setRecordModalOpen(false);
    setReference('');
    setNotes('');

    try {
      confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 } });
    } catch (err) {}

    success('Payment Recorded', `Invoice ${newPayment.invoiceNumber} recorded for ${selectedClientObj.name}.`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Financial Ledger & Collections
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 dark:text-white mt-1">
            Payment Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Record rent, deposits, water metering utilities, penalties and track outstanding balances.
          </p>
        </div>

        <button
          onClick={() => setRecordModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md hover:shadow-glow transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Payment</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="glass-card p-5 rounded-2xl border shadow-soft">
          <span className="text-[11px] uppercase font-bold text-slate-400">Total Collected</span>
          <p className="text-2xl sm:text-3xl font-extrabold font-display text-emerald-600 dark:text-emerald-400 mt-1">
            ${totalCollected.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-1">August 2026 recorded revenue</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border shadow-soft">
          <span className="text-[11px] uppercase font-bold text-slate-400">Pending & Outstanding</span>
          <p className="text-2xl sm:text-3xl font-extrabold font-display text-amber-500 mt-1">
            ${totalOutstanding.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-1">Across 4 resident accounts</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border shadow-soft">
          <span className="text-[11px] uppercase font-bold text-slate-400">Overdue Notices</span>
          <p className="text-2xl sm:text-3xl font-extrabold font-display text-rose-500 mt-1">
            {overdueCount} Accounts
          </p>
          <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-1">Requires follow-up</p>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="glass-card p-4 rounded-2xl shadow-soft flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by invoice #, client name, estate, or payment reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
          >
            <option value="all">All Charge Types</option>
            <option value="rent">Rent Only</option>
            <option value="deposit">Deposit Only</option>
            <option value="utility">Utilities & Water</option>
            <option value="penalty">Penalties</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
          >
            <option value="all">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Payment Table */}
      <div className="glass-card rounded-3xl shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold text-[10px] bg-slate-50/50 dark:bg-slate-800/30">
                <th className="py-3.5 px-6">Invoice #</th>
                <th className="py-3.5 px-4">Resident</th>
                <th className="py-3.5 px-4">Estate & Unit</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Method & Ref</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-6 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {pagedPayments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 px-6 font-bold font-mono text-slate-900 dark:text-white">
                    {p.invoiceNumber}
                  </td>
                  <td className="py-4 px-4 font-bold text-slate-900 dark:text-white">{p.clientName}</td>
                  <td className="py-4 px-4 font-medium">
                    {p.propertyName} <span className="text-brand-600 dark:text-brand-400 font-bold">(Unit {p.roomNumber})</span>
                  </td>
                  <td className="py-4 px-4 capitalize font-semibold">{p.type}</td>
                  <td className="py-4 px-4 font-extrabold text-slate-900 dark:text-white">${p.amount}</td>
                  <td className="py-4 px-4 text-slate-500">{p.date}</td>
                  <td className="py-4 px-4">
                    <p className="font-semibold text-slate-900 dark:text-white">{p.method}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{p.reference}</p>
                  </td>
                  <td className="py-4 px-4">
                    <Badge
                      variant={
                        p.status === 'paid'
                          ? 'success'
                          : p.status === 'pending'
                          ? 'warning'
                          : 'danger'
                      }
                      size="sm"
                      dot
                    >
                      {p.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => setSelectedReceipt(p)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 hover:text-brand-600 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors"
                    >
                      View Receipt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={pageIndex}
          totalItems={filteredPayments.length}
          pageSize={pageSize}
          onPageChange={(p) => setPageIndex(p)}
          onPageSizeChange={(s) => { setPageSize(s); setPageIndex(1); }}
        />
      </div>

      {/* Record Payment Modal */}
      <Modal isOpen={recordModalOpen} onClose={() => setRecordModalOpen(false)} title="Record Resident Payment">
        <form onSubmit={handleRecordSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[10px] text-slate-400 font-bold mb-1">
              Select Resident / Tenant *
            </label>
            <select
              value={clientId}
              onChange={(e) => {
                setClientId(e.target.value);
                const found = clients.find((c) => c.id === e.target.value);
                if (found) setAmount(found.monthlyRent);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — Unit {c.currentRoomNumber} ({c.currentPropertyName}) [Rent: ${c.monthlyRent}]
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Charge Type *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as PaymentType)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              >
                <option value="rent">Monthly Apartment Rent</option>
                <option value="deposit">Security Deposit</option>
                <option value="utility">Water & Utilities</option>
                <option value="penalty">Late Fee / Penalty</option>
                <option value="maintenance">Maintenance Damage Charge</option>
                <option value="other">Other Charge</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Amount ($ USD) *
              </label>
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-extrabold text-emerald-600 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Payment Method *
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              >
                <option value="Mobile Money">MTN / Airtel Mobile Money</option>
                <option value="Bank Transfer">Bank Transfer (BK / I&M)</option>
                <option value="Credit Card">Credit / Debit Card</option>
                <option value="Cash">Cash Receipt</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Transaction Reference
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. MOMO-8829104"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 font-bold mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Cleared August 2026 rent in full"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all"
            >
              Record Payment & Issue Receipt
            </button>
          </div>
        </form>
      </Modal>

      {/* Receipt Modal */}
      {selectedReceipt && (
        <Modal
          isOpen={Boolean(selectedReceipt)}
          onClose={() => setSelectedReceipt(null)}
          maxWidth="md"
          title="Payment Receipt"
        >
          <div className="space-y-4 pt-2 text-slate-900 dark:text-white text-xs">
            <div className="flex items-center justify-between pb-3 border-b">
              <span className="font-extrabold font-display text-brand-600 text-base">PANTHER PMS</span>
              <Badge variant="success" size="sm">CONFIRMED</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Invoice #</span>
                <p className="font-mono font-bold">{selectedReceipt.invoiceNumber}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Date</span>
                <p>{selectedReceipt.date}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Client</span>
                <p className="font-bold">{selectedReceipt.clientName}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Property</span>
                <p>{selectedReceipt.propertyName} (Unit {selectedReceipt.roomNumber})</p>
              </div>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1.5 border">
              <div className="flex justify-between font-semibold">
                <span className="capitalize">{selectedReceipt.type} Charge:</span>
                <span>${selectedReceipt.amount}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Reference:</span>
                <span>{selectedReceipt.method} ({selectedReceipt.reference})</span>
              </div>
            </div>
            <button
              onClick={() => window.print()}
              className="w-full py-2.5 bg-slate-900 dark:bg-brand-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Receipt</span>
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};
