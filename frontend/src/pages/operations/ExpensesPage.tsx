import React, { useState, useMemo, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { useExpensesQuery, useCreateExpenseMutation } from '../../api/expenses';
import { usePropertiesQuery } from '../../api/properties';
import {
  TrendingDown,
  Search,
  Plus,
  Filter,
  DollarSign,
  Building,
  Calendar,
  Receipt,
  CheckCircle2,
  PieChart as PieIcon,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Pagination } from '../../components/common/Pagination';
import { Modal } from '../../components/common/Modal';
import { Expense, ExpenseCategory, PaymentMethod } from '../../types';

export const ExpensesPage: React.FC = () => {
  const expensesQuery = useExpensesQuery();
  const propertiesQuery = usePropertiesQuery();
  const createExpenseMutation = useCreateExpenseMutation();
  const { success, error } = useToast();

  const expenses = expensesQuery.data ?? [];
  const properties = propertiesQuery.data ?? [];
  const isLoading = expensesQuery.isLoading || propertiesQuery.isLoading;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [recordModalOpen, setRecordModalOpen] = useState(false);

  // Form State
  const [propertyId, setPropertyId] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Maintenance');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(350);
  const [vendor, setVendor] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Bank Transfer');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!propertyId && properties.length > 0) setPropertyId(properties[0].id);
  }, [properties, propertyId]);

  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

  const categories: ExpenseCategory[] = [
    'Maintenance',
    'Cleaning',
    'Security',
    'Utilities',
    'Repairs',
    'Supplies',
    'Staff',
    'Landscaping',
    'Other',
  ];

  const filteredExpenses = useMemo(() => expenses.filter((e) => {
    if (selectedCategory !== 'all' && e.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        e.description.toLowerCase().includes(q) ||
        e.vendor.toLowerCase().includes(q) ||
        e.propertyName.toLowerCase().includes(q)
      );
    }
    return true;
  }), [expenses, selectedCategory, searchQuery]);

  const pagedExpenses = useMemo(() => {
    const start = (pageIndex - 1) * pageSize;
    return filteredExpenses.slice(start, start + pageSize);
  }, [filteredExpenses, pageIndex, pageSize]);

  const handleRecordExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const prop = properties.find((p) => p.id === propertyId) || properties[0];
    if (!prop) return;

    try {
      const newExp = await createExpenseMutation.mutateAsync({
        propertyId: prop.id,
        category,
        description,
        amount,
        date: new Date().toISOString().split('T')[0],
        vendor: vendor || 'Direct Service Vendor',
        paymentMethod,
        status: 'paid',
        receiptAttached: true,
        notes,
      });

      setRecordModalOpen(false);
      setDescription('');
      setVendor('');
      setNotes('');
      success('Expense Logged', `Recorded $${newExp.amount} for ${newExp.category} (${newExp.propertyName}).`);
    } catch {
      error('Recording Failed', 'Could not record this expense. Please try again.');
    }
  };

  if (isLoading) {
    return <div className="py-24 text-center text-sm text-slate-400">Loading expenses…</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Property Outflows & Operations Cost
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 dark:text-white mt-1">
            Expense Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Record maintenance overhead, cleaning contracts, security patrols, and compound supplies.
          </p>
        </div>

        <button
          onClick={() => setRecordModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Expense</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="glass-card p-5 rounded-2xl border shadow-soft">
          <span className="text-[11px] uppercase font-bold text-slate-400">Total Month-to-Date Outflows</span>
          <p className="text-2xl sm:text-3xl font-extrabold font-display text-rose-600 dark:text-rose-400 mt-1">
            ${totalExpenses.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-1">August 2026 operational expenses</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border shadow-soft">
          <span className="text-[11px] uppercase font-bold text-slate-400">Top Expense Category</span>
          <p className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 dark:text-white mt-1">
            Security & Guarding
          </p>
          <p className="text-xs text-slate-500 mt-1">ISCO Security 24/7 contract ($1,400/mo)</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border shadow-soft">
          <span className="text-[11px] uppercase font-bold text-slate-400">Total Vouchers Logged</span>
          <p className="text-2xl sm:text-3xl font-extrabold font-display text-brand-600 dark:text-brand-400 mt-1">
            {expenses.length} Vouchers
          </p>
          <p className="text-xs text-emerald-600 font-semibold mt-1">100% receipt verified</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 rounded-2xl shadow-soft flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by description, vendor, or property..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Expense Table */}
      <div className="glass-card rounded-3xl shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold text-[10px] bg-slate-50/50 dark:bg-slate-800/30">
                <th className="py-3.5 px-6">Date</th>
                <th className="py-3.5 px-4">Estate</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4">Vendor</th>
                <th className="py-3.5 px-4">Method</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {pagedExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 px-6 text-slate-500 font-medium">{exp.date}</td>
                  <td className="py-4 px-4 font-bold text-slate-900 dark:text-white">{exp.propertyName}</td>
                  <td className="py-4 px-4">
                    <Badge variant="purple" size="sm">{exp.category}</Badge>
                  </td>
                  <td className="py-4 px-4 max-w-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                    {exp.description}
                  </td>
                  <td className="py-4 px-4 font-medium text-slate-600 dark:text-slate-400">{exp.vendor}</td>
                  <td className="py-4 px-4">{exp.paymentMethod}</td>
                  <td className="py-4 px-4 font-extrabold text-rose-600 dark:text-rose-400">${exp.amount}</td>
                  <td className="py-4 px-6 text-right">
                    <Badge variant={exp.status === 'paid' ? 'success' : 'warning'} size="sm">
                      {exp.status.toUpperCase()}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={pageIndex}
          totalItems={filteredExpenses.length}
          pageSize={pageSize}
          onPageChange={(p) => setPageIndex(p)}
          onPageSizeChange={(s) => { setPageSize(s); setPageIndex(1); }}
        />
      </div>

      {/* Record Expense Modal */}
      <Modal isOpen={recordModalOpen} onClose={() => setRecordModalOpen(false)} title="Record Property Expense">
        <form onSubmit={handleRecordExpense} className="space-y-4 text-xs">
          <div>
            <label className="block text-[10px] text-slate-400 font-bold mb-1">
              Applicable Property *
            </label>
            <select
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.location})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-extrabold text-rose-500 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 font-bold mb-1">
              Expense Description *
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Sanitary deep clean of lobby & elevator cabs"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Vendor / Supplier Name *
              </label>
              <input
                type="text"
                required
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder="e.g. Kigali Clean & Shine Ltd"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Disbursement Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              >
                <option value="Bank Transfer">Bank Swift / Transfer</option>
                <option value="Mobile Money">MTN Mobile Money Float</option>
                <option value="Credit Card">Corporate Visa Card</option>
                <option value="Cash">Petty Cash</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md"
            >
              Record Operational Expense
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
