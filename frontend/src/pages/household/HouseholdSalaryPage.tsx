import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useMyPayrollRecordsQuery } from '../../api/payrollRecords';
import {
  Receipt,
  DollarSign,
  Printer,
  CheckCircle2,
  Clock,
  Briefcase,
  ShieldCheck,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Pagination } from '../../components/common/Pagination';
import { Modal } from '../../components/common/Modal';
import { PayrollRecord } from '../../types';

export const HouseholdSalaryPage: React.FC = () => {
  const { currentUser } = useAuth();
  // Server-scoped to the logged-in user's employeeId via the JWT — no client-side filter needed
  // (previously hardcoded to always show employee 'emp-03' regardless of who was logged in).
  const { data: myPayrolls = [], isLoading } = useMyPayrollRecordsQuery();
  const [selectedSlip, setSelectedSlip] = useState<PayrollRecord | null>(null);
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const pagedPayrolls = useMemo(() => {
    const start = (pageIndex - 1) * pageSize;
    return myPayrolls.slice(start, start + pageSize);
  }, [myPayrolls, pageIndex, pageSize]);

  if (isLoading) {
    return <div className="py-24 text-center text-sm text-slate-400">Loading your payslips…</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200 dark:border-slate-800">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
          Staff Compensation
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 dark:text-white mt-1">
          My Salary & Payment History
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          {currentUser?.name}{currentUser?.title ? ` — ${currentUser.title}` : ''}
        </p>
      </div>

      {/* Salary Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="glass-card p-5 rounded-2xl border shadow-soft">
          <span className="text-[11px] uppercase font-bold text-slate-400">Basic Monthly Base</span>
          <p className="text-2xl font-bold font-display text-slate-900 dark:text-white mt-1">$950</p>
          <p className="text-xs text-slate-500 mt-1">Permanent Employment Tier</p>
        </div>
        <div className="glass-card p-5 rounded-2xl border shadow-soft">
          <span className="text-[11px] uppercase font-bold text-slate-400">Standard Allowances</span>
          <p className="text-2xl font-bold font-display text-emerald-600 dark:text-emerald-400 mt-1">+$120</p>
          <p className="text-xs text-slate-500 mt-1">Transport & Housing allowance</p>
        </div>
        <div className="glass-card p-5 rounded-2xl border shadow-soft">
          <span className="text-[11px] uppercase font-bold text-slate-400">August Net Payable</span>
          <p className="text-2xl font-bold font-display text-brand-600 dark:text-brand-400 mt-1">$1,038</p>
          <p className="text-xs text-emerald-600 font-semibold mt-1">Disbursement: Aug 30 (MoMo)</p>
        </div>
      </div>

      {/* Payslips Table */}
      <div className="glass-card rounded-3xl shadow-soft overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
            Official Salary Payslips
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold text-[10px] bg-slate-50/50 dark:bg-slate-800/30">
                <th className="py-3.5 px-6">Slip #</th>
                <th className="py-3.5 px-4">Period</th>
                <th className="py-3.5 px-4">Basic Pay</th>
                <th className="py-3.5 px-4">Allowances</th>
                <th className="py-3.5 px-4">Deductions</th>
                <th className="py-3.5 px-4">Net Salary</th>
                <th className="py-3.5 px-4">Payment Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-6 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {pagedPayrolls.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 px-6 font-mono font-bold text-slate-900 dark:text-white">{p.payrollNumber}</td>
                  <td className="py-4 px-4 font-bold">{p.period}</td>
                  <td className="py-4 px-4">${p.basicSalary}</td>
                  <td className="py-4 px-4 text-emerald-600 font-semibold">+${p.allowances + p.bonuses}</td>
                  <td className="py-4 px-4 text-rose-600 font-semibold">-${p.deductions + p.taxAmount}</td>
                  <td className="py-4 px-4 font-extrabold text-slate-900 dark:text-white">${p.netSalary}</td>
                  <td className="py-4 px-4 text-slate-500">{p.paymentDate}</td>
                  <td className="py-4 px-4">
                    <Badge variant={p.paymentStatus === 'Paid' ? 'success' : 'warning'} size="sm">
                      {p.paymentStatus}
                    </Badge>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => setSelectedSlip(p)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 hover:text-brand-600 font-bold text-xs"
                    >
                      Payslip
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={pageIndex}
          totalItems={myPayrolls.length}
          pageSize={pageSize}
          onPageChange={(p) => setPageIndex(p)}
          onPageSizeChange={(s) => { setPageSize(s); setPageIndex(1); }}
        />
      </div>

      {/* Payslip Modal */}
      {selectedSlip && (
        <Modal
          isOpen={Boolean(selectedSlip)}
          onClose={() => setSelectedSlip(null)}
          maxWidth="md"
          title="Staff Salary Payslip"
        >
          <div className="space-y-5 text-xs text-slate-900 dark:text-white">
            <div className="flex items-center justify-between pb-3 border-b">
              <span className="font-extrabold font-display text-brand-600 text-base">PANTHER PMS</span>
              <Badge variant="success" size="sm">{selectedSlip.paymentStatus.toUpperCase()}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Payroll #</span>
                <p className="font-mono font-bold">{selectedSlip.payrollNumber}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Period</span>
                <p className="font-bold">{selectedSlip.period}</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl space-y-2 border">
              <div className="flex justify-between">
                <span>Basic Salary:</span>
                <span className="font-bold">${selectedSlip.basicSalary}</span>
              </div>
              <div className="flex justify-between text-emerald-600">
                <span>Allowances & Bonuses:</span>
                <span className="font-bold">+${selectedSlip.allowances + selectedSlip.bonuses}</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>Taxes & Deductions:</span>
                <span className="font-bold">-${selectedSlip.deductions + selectedSlip.taxAmount}</span>
              </div>
              <div className="pt-2 border-t flex justify-between font-bold text-sm">
                <span>Net Transferred:</span>
                <span className="text-emerald-600">${selectedSlip.netSalary}</span>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="w-full py-2.5 bg-slate-900 dark:bg-brand-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Slip</span>
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};
