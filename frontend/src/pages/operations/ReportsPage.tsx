import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import {
  FileBarChart,
  Download,
  Printer,
  FileSpreadsheet,
  Calendar,
  Filter,
  DollarSign,
  TrendingUp,
  Building,
  CheckCircle2,
  Droplets,
  ClipboardCheck,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export const ReportsPage: React.FC = () => {
  const { properties, rooms, clients, payments, expenses, waterMeters, preventiveTasks, payrollRecords } = useData();
  const { success, info } = useToast();

  const [reportType, setReportType] = useState('revenue');
  const [dateRange, setDateRange] = useState('August 2026');

  const handleExportPDF = () => {
    success('Generating PDF', `Exported "${reportType.toUpperCase()}" report for ${dateRange} as PDF.`);
  };

  const handleExportExcel = () => {
    success('Generating Excel (.xlsx)', `Exported "${reportType.toUpperCase()}" data sheet for ${dateRange}.`);
  };

  const totalRevenue = payments.filter((p) => p.status === 'paid').reduce((acc, p) => acc + p.amount, 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Business Intelligence & Audits
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 dark:text-white mt-1">
            Reports & Analytics Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Generate executive statements, financial ledgers, occupancy audits, and export PDF / Excel spreadsheets.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-brand-400" />
            <span>Export PDF</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={() => window.print()}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Print"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Report Filter & Type Selector */}
      <div className="glass-card p-5 rounded-2xl shadow-soft space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Select Report Category
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
            >
              <option value="revenue">Revenue & Collection Statement</option>
              <option value="expenses">Operational Expense Breakdown</option>
              <option value="occupancy">Portfolio Occupancy & Vacancy Audit</option>
              <option value="water">Water Submetering & Utility Yield</option>
              <option value="preventive">Preventive Maintenance Completion</option>
              <option value="payroll">HR Payroll & Staff Compensation</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Audit Period
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
            >
              <option value="August 2026">Current Month (August 2026)</option>
              <option value="July 2026">Last Month (July 2026)</option>
              <option value="Q2 2026">Q2 2026 (Apr - Jun)</option>
              <option value="YTD 2026">Year-to-Date 2026 (Jan - Aug)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Rendered Report Preview Sheet */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl shadow-soft space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="font-extrabold font-display text-brand-600 text-lg">PANTHER LIVING RWANDA</span>
            <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white capitalize">
              {reportType.replace('_', ' ')} Statement Preview — {dateRange}
            </h2>
          </div>
          <Badge variant="purple" size="md">CONFIRMED AUDIT</Badge>
        </div>

        {/* Dynamic Table Content based on Report Type */}
        {reportType === 'revenue' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300">Gross Collections</span>
                <p className="text-2xl font-bold font-display text-emerald-600 dark:text-emerald-400 mt-1">${totalRevenue.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-800">
                <span className="text-[10px] uppercase font-bold text-rose-800 dark:text-rose-300">Total Operational Costs</span>
                <p className="text-2xl font-bold font-display text-rose-600 dark:text-rose-400 mt-1">${totalExpenses.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-brand-50 dark:bg-brand-950/40 rounded-2xl border border-brand-200 dark:border-brand-800">
                <span className="text-[10px] uppercase font-bold text-brand-800 dark:text-brand-300">Net Operating Yield</span>
                <p className="text-2xl font-bold font-display text-brand-600 dark:text-brand-400 mt-1">${(totalRevenue - totalExpenses).toLocaleString()}</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold text-[10px]">
                    <th className="py-2.5">Invoice #</th>
                    <th className="py-2.5">Client</th>
                    <th className="py-2.5">Estate & Room</th>
                    <th className="py-2.5">Date</th>
                    <th className="py-2.5">Category</th>
                    <th className="py-2.5">Amount</th>
                    <th className="py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td className="py-2.5 font-mono font-bold">{p.invoiceNumber}</td>
                      <td className="py-2.5 font-bold">{p.clientName}</td>
                      <td className="py-2.5">{p.propertyName} (Unit {p.roomNumber})</td>
                      <td className="py-2.5 text-slate-500">{p.date}</td>
                      <td className="py-2.5 capitalize">{p.type}</td>
                      <td className="py-2.5 font-bold">${p.amount}</td>
                      <td className="py-2.5"><Badge variant="success" size="sm">{p.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {reportType === 'occupancy' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold text-[10px]">
                  <th className="py-2.5">Property Name</th>
                  <th className="py-2.5">Location</th>
                  <th className="py-2.5">Total Units</th>
                  <th className="py-2.5">Occupied</th>
                  <th className="py-2.5">Available</th>
                  <th className="py-2.5">Occupancy Rate</th>
                  <th className="py-2.5">Est. Monthly Roll</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {properties.map((prop) => (
                  <tr key={prop.id}>
                    <td className="py-2.5 font-bold">{prop.name}</td>
                    <td className="py-2.5">{prop.location}</td>
                    <td className="py-2.5">{prop.totalRooms}</td>
                    <td className="py-2.5 font-bold text-emerald-600">{prop.occupiedRooms}</td>
                    <td className="py-2.5 font-bold text-sky-600">{prop.availableRooms}</td>
                    <td className="py-2.5 font-bold">{Math.round((prop.occupiedRooms / prop.totalRooms) * 100)}%</td>
                    <td className="py-2.5 font-bold text-brand-600">${prop.monthlyRevenueEstimate.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'preventive' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold text-[10px]">
                  <th className="py-2.5">Category</th>
                  <th className="py-2.5">Task</th>
                  <th className="py-2.5">Inspector</th>
                  <th className="py-2.5">Status</th>
                  <th className="py-2.5">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {preventiveTasks.map((t) => (
                  <tr key={t.id}>
                    <td className="py-2.5 font-bold">{t.category}</td>
                    <td className="py-2.5">{t.taskName}</td>
                    <td className="py-2.5">{t.assignedStaffName}</td>
                    <td className="py-2.5"><Badge variant={t.status === 'pass' ? 'success' : 'warning'} size="sm">{t.status}</Badge></td>
                    <td className="py-2.5 italic">&ldquo;{t.remarks}&rdquo;</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'water' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold text-[10px]">
                  <th className="py-2.5">Meter ID</th>
                  <th className="py-2.5">Resident</th>
                  <th className="py-2.5">Unit</th>
                  <th className="py-2.5">Usage (m³)</th>
                  <th className="py-2.5">Rate ($/m³)</th>
                  <th className="py-2.5">Billed Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {waterMeters.map((m) => (
                  <tr key={m.id}>
                    <td className="py-2.5 font-mono">{m.meterNumber}</td>
                    <td className="py-2.5 font-bold">{m.clientName}</td>
                    <td className="py-2.5">{m.propertyName} ({m.roomNumber})</td>
                    <td className="py-2.5 font-bold text-sky-600">{m.consumptionM3} m³</td>
                    <td className="py-2.5">${m.ratePerM3}</td>
                    <td className="py-2.5 font-bold text-emerald-600">${m.totalAmount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
