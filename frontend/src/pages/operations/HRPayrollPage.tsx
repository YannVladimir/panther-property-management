import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import {
  Briefcase,
  Users,
  DollarSign,
  Receipt,
  Printer,
  Plus,
  CheckCircle2,
  Clock,
  User,
  Building,
  Search,
  Filter,
  Shield,
  Star,
  Eye,
  ChevronRight,
  Upload,
  X,
  Check,
  Sparkles,
  Layers,
  Award,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Pagination } from '../../components/common/Pagination';
import { Modal } from '../../components/common/Modal';
import { Employee, PayrollRecord } from '../../types';

export const HRPayrollPage: React.FC = () => {
  const { employees, payrollRecords, addEmployee, properties } = useData();
  const { success } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'employees' | 'payroll'>('employees');
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [empPageIndex, setEmpPageIndex] = useState(1);
  const [empPageSize, setEmpPageSize] = useState(10);
  const [payPageIndex, setPayPageIndex] = useState(1);
  const [payPageSize, setPayPageSize] = useState(10);

  // Slide-In Side Panel: Add New Employee
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState<Employee['department']>('Housekeeping');
  const [employmentStatus, setEmploymentStatus] = useState<Employee['employmentStatus']>('Full-Time');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [basicSalary, setBasicSalary] = useState<number>(900);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [avatar, setAvatar] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');

  // Payslip Modal
  const [selectedSlip, setSelectedSlip] = useState<PayrollRecord | null>(null);

  const totalMonthlyPayroll = payrollRecords.reduce((acc, p) => acc + p.netSalary, 0);
  const activeEmployeesCount = employees.filter((e) => (e.status || 'active') === 'active').length;

  // Calculate task completion across company
  const allTasks = employees.flatMap((e) => e.dailyTasks || []);
  const completedTasks = allTasks.filter((t) => t.status === 'Completed').length;
  const companyTaskRate = allTasks.length > 0 ? Math.round((completedTasks / allTasks.length) * 100) : 95;

  const filteredEmployees = useMemo(() => employees.filter((emp) => {
    if (departmentFilter !== 'all' && emp.department !== departmentFilter) return false;
    if (statusFilter !== 'all' && (emp.status || 'active') !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        emp.name.toLowerCase().includes(q) ||
        emp.position.toLowerCase().includes(q) ||
        emp.contact.toLowerCase().includes(q) ||
        emp.nationalId.toLowerCase().includes(q)
      );
    }
    return true;
  }), [employees, departmentFilter, statusFilter, searchQuery]);

  const pagedEmployees = useMemo(() => {
    const start = (empPageIndex - 1) * empPageSize;
    return filteredEmployees.slice(start, start + empPageSize);
  }, [filteredEmployees, empPageIndex, empPageSize]);

  const pagedPayroll = useMemo(() => {
    const start = (payPageIndex - 1) * payPageSize;
    return payrollRecords.slice(start, start + payPageSize);
  }, [payrollRecords, payPageIndex, payPageSize]);

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    const newEmp = addEmployee({
      name,
      position,
      department,
      employmentStatus,
      status: 'active',
      contact,
      email,
      nationalId,
      basicSalary: Number(basicSalary),
      startDate,
      avatar,
      documents: [
        {
          id: `edoc-${Date.now()}`,
          name: `${name.replace(/\s+/g, '_')}_Contract.pdf`,
          type: 'Employment Contract',
          fileUrl: 'https://example.com/contract.pdf',
          uploadDate: startDate,
          status: 'Verified',
        },
      ],
      dailyTasks: [],
      damages: [],
    });

    success('Employee Registered', `Added ${newEmp.name} to the HR registry.`);
    setAddDrawerOpen(false);
    setName('');
    setPosition('');
    setContact('');
    setEmail('');
    setNationalId('');
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 text-xs font-bold mb-1 border border-brand-200 dark:border-brand-800/60">
            <Users className="w-3.5 h-3.5" />
            Human Capital & Staff Operations System
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 dark:text-white">
            HR & Payroll Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Personnel profiles, daily task dispatching with supervisor ranking, compliance documents, and payroll disbursements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setAddDrawerOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md hover:shadow-glow transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Employee</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-2xl border shadow-soft space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Staff Roster</span>
          <p className="text-2xl font-extrabold font-display text-slate-900 dark:text-white">
            {employees.length} Staff
          </p>
          <p className="text-[11px] text-slate-500">{activeEmployeesCount} on active duty</p>
        </div>

        <div className="glass-card p-4 rounded-2xl border shadow-soft space-y-1 bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900">
          <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Monthly Net Payroll</span>
          <p className="text-2xl font-extrabold font-display text-emerald-600 dark:text-emerald-400">
            ${totalMonthlyPayroll.toLocaleString()}
          </p>
          <p className="text-[11px] text-emerald-600 font-semibold">{payrollRecords.length} Generated slips</p>
        </div>

        <div className="glass-card p-4 rounded-2xl border shadow-soft space-y-1 bg-sky-50/40 dark:bg-sky-950/20 border-sky-200 dark:border-sky-900">
          <span className="text-[10px] uppercase font-bold text-sky-600 dark:text-sky-400">Daily Task Efficiency</span>
          <p className="text-2xl font-extrabold font-display text-sky-600 dark:text-sky-400">
            {companyTaskRate}%
          </p>
          <p className="text-[11px] text-slate-400">{completedTasks}/{allTasks.length} Shift tasks done</p>
        </div>

        <div className="glass-card p-4 rounded-2xl border shadow-soft space-y-1 bg-brand-50/40 dark:bg-brand-950/20 border-brand-200 dark:border-brand-900">
          <span className="text-[10px] uppercase font-bold text-brand-600 dark:text-brand-400">Departments</span>
          <p className="text-2xl font-extrabold font-display text-brand-600 dark:text-brand-400">
            5 Domains
          </p>
          <p className="text-[11px] text-brand-600 font-semibold">Operations, Housekeeping, Tech</p>
        </div>
      </div>

      {/* Main View Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('employees')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'employees'
              ? 'bg-brand-600 text-white shadow-md'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
          }`}
        >
          Staff Directory & Daily Operations ({employees.length})
        </button>

        <button
          onClick={() => setActiveTab('payroll')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'payroll'
              ? 'bg-brand-600 text-white shadow-md'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
          }`}
        >
          Company Payroll Ledger ({payrollRecords.length})
        </button>
      </div>

      {activeTab === 'employees' ? (
        /* ═══════════════════════════════════════════════════════════ */
        /* STAFF DIRECTORY TABLE & FILTER BAR                          */
        /* ═══════════════════════════════════════════════════════════ */
        <div className="space-y-4">
          <div className="glass-card p-4 rounded-2xl shadow-soft flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search staff by name, position, phone, or National ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              >
                <option value="all">All Departments</option>
                <option value="Operations">Operations</option>
                <option value="Housekeeping">Housekeeping</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Finance">Finance</option>
                <option value="Security">Security</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active On Duty</option>
                <option value="on_leave">On Leave</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div className="glass-card rounded-3xl shadow-soft overflow-hidden border">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold text-[10px] bg-slate-50/50 dark:bg-slate-800/30">
                    <th className="py-3.5 px-6">Employee</th>
                    <th className="py-3.5 px-4">Position & Role</th>
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Basic Pay</th>
                    <th className="py-3.5 px-4">Tasks Done</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {pagedEmployees.map((emp) => {
                    const tasks = emp.dailyTasks || [];
                    const completed = tasks.filter((t) => t.status === 'Completed').length;

                    return (
                      <tr
                        key={emp.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                        onClick={() => navigate(`/operations/hr-payroll/${emp.id}`)}
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <img
                              src={emp.avatar}
                              alt={emp.name}
                              className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                            />
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white text-xs group-hover:text-brand-600 transition-colors">
                                {emp.name}
                              </p>
                              <p className="text-[11px] text-slate-400 mt-0.5">{emp.contact}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-bold text-slate-800 dark:text-slate-200">
                          {emp.position}
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px]">
                            {emp.department}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-medium text-slate-500">
                          {emp.employmentStatus}
                        </td>
                        <td className="py-4 px-4 font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                          ${emp.basicSalary}
                        </td>
                        <td className="py-4 px-4 font-bold">
                          <span className="text-sky-600 dark:text-sky-400">{completed}</span>
                          <span className="text-slate-400">/{tasks.length}</span>
                        </td>
                        <td className="py-4 px-4">
                          <Badge
                            variant={
                              (emp.status || 'active') === 'active'
                                ? 'success'
                                : emp.status === 'on_leave'
                                ? 'warning'
                                : 'danger'
                            }
                            size="sm"
                            dot
                          >
                            {(emp.status || 'active').toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/operations/hr-payroll/${emp.id}`);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900 text-brand-700 dark:text-brand-300 font-bold text-xs transition-colors inline-flex items-center gap-1"
                          >
                            <span>View Dossier</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={empPageIndex}
              totalItems={filteredEmployees.length}
              pageSize={empPageSize}
              onPageChange={(p) => setEmpPageIndex(p)}
              onPageSizeChange={(s) => { setEmpPageSize(s); setEmpPageIndex(1); }}
            />
          </div>
        </div>
      ) : (
        /* ═══════════════════════════════════════════════════════════ */
        /* COMPANY PAYROLL TABLE                                       */
        /* ═══════════════════════════════════════════════════════════ */
        <div className="glass-card rounded-3xl shadow-soft overflow-hidden border">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
              Company Monthly Payroll Ledger
            </h3>
            <span className="text-xs font-bold text-slate-400">{payrollRecords.length} Slips Generated</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold text-[10px] bg-slate-50/50 dark:bg-slate-800/30">
                  <th className="py-3.5 px-6">Payroll Slip</th>
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Period</th>
                  <th className="py-3.5 px-4">Gross Basic</th>
                  <th className="py-3.5 px-4">Allowances</th>
                  <th className="py-3.5 px-4">Tax & Deductions</th>
                  <th className="py-3.5 px-4">Net Payout</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-6 text-right">View Slip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {pagedPayroll.map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-4 px-6 font-mono font-bold text-slate-900 dark:text-white">
                      {pay.payrollNumber}
                    </td>
                    <td className="py-4 px-4 font-bold">{pay.employeeName}</td>
                    <td className="py-4 px-4">{pay.department}</td>
                    <td className="py-4 px-4 font-bold">{pay.period}</td>
                    <td className="py-4 px-4 font-mono">${pay.basicSalary}</td>
                    <td className="py-4 px-4 font-mono text-emerald-600">+${pay.allowances + pay.bonuses}</td>
                    <td className="py-4 px-4 font-mono text-rose-500">-${pay.deductions + pay.taxAmount}</td>
                    <td className="py-4 px-4 font-extrabold font-mono text-sm text-emerald-600">
                      ${pay.netSalary}
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant="success" size="sm" dot>
                        {pay.paymentStatus.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setSelectedSlip(pay)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 font-bold text-xs"
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
            currentPage={payPageIndex}
            totalItems={payrollRecords.length}
            pageSize={payPageSize}
            onPageChange={(p) => setPayPageIndex(p)}
            onPageSizeChange={(s) => { setPayPageSize(s); setPayPageIndex(1); }}
          />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SLIDE-IN SIDE PANEL: ADD NEW EMPLOYEE                       */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div
        className={`fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300 ${
          addDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setAddDrawerOpen(false)}
      />

      <aside
        className={`fixed right-0 top-0 h-full z-50 w-full max-w-xl bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out ${
          addDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 font-bold text-[10px] mb-1">
              <User className="w-3 h-3" />
              <span>HR Onboarding Form</span>
            </div>
            <h2 className="text-lg font-extrabold font-display text-slate-900 dark:text-white">
              Register New Employee
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Create employee profile, set salary, designate role, and initialize personnel dossier.
            </p>
          </div>
          <button
            onClick={() => setAddDrawerOpen(false)}
            className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <form onSubmit={handleAddEmployee} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-700 dark:text-slate-300">
          {/* Personal & Identification Information */}
          <div className="space-y-3">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Personal Information & Identity *
            </label>
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Full Legal Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jean-Luc Nkurunziza"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">
                  Contact Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="+250 788 000 111"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@panther.rw"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                National ID / Passport Number *
              </label>
              <input
                type="text"
                required
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                placeholder="1199..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Job & Department Details */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Role & Department Assignment *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">
                  Job Position / Title *
                </label>
                <input
                  type="text"
                  required
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="e.g. Facilities & HVAC Specialist"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">
                  Department *
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                >
                  <option value="Operations">Operations</option>
                  <option value="Housekeeping">Housekeeping</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Finance">Finance</option>
                  <option value="Security">Security</option>
                  <option value="Management">Management</option>
                </select>
              </div>
            </div>
          </div>

          {/* Compensation & Contract Details */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Compensation & Contract Terms *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">
                  Monthly Basic Salary ($ USD) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={basicSalary}
                  onChange={(e) => setBasicSalary(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-extrabold font-mono text-emerald-600 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">
                  Employment Contract Type *
                </label>
                <select
                  value={employmentStatus}
                  onChange={(e) => setEmploymentStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                >
                  <option value="Full-Time">Full-Time Permanent</option>
                  <option value="Part-Time">Part-Time</option>
                  <option value="Contract">Fixed Term Contract</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">
                  Employment Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">
                  Avatar Image URL
                </label>
                <input
                  type="text"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[11px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Drawer Footer Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setAddDrawerOpen(false)}
              className="px-4 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Save & Onboard Employee</span>
            </button>
          </div>
        </form>
      </aside>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* PAYSLIP VIEW MODAL                                          */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {selectedSlip && (
        <Modal
          isOpen={Boolean(selectedSlip)}
          onClose={() => setSelectedSlip(null)}
          title={`Payslip: ${selectedSlip.payrollNumber}`}
          subtitle={`Disbursement for ${selectedSlip.employeeName} (${selectedSlip.period})`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Employee Name:</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedSlip.employeeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Position / Dept:</span>
                <span className="font-bold">{selectedSlip.position} ({selectedSlip.department})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Period:</span>
                <span className="font-bold">{selectedSlip.period}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Channel:</span>
                <span className="font-bold">{selectedSlip.paymentMethod}</span>
              </div>
            </div>

            <div className="space-y-2 border-t border-b border-slate-200 dark:border-slate-800 py-3">
              <div className="flex justify-between">
                <span>Basic Salary:</span>
                <span className="font-mono font-bold">${selectedSlip.basicSalary}</span>
              </div>
              <div className="flex justify-between text-emerald-600">
                <span>Allowances & Bonuses:</span>
                <span className="font-mono font-bold">+${selectedSlip.allowances + selectedSlip.bonuses}</span>
              </div>
              <div className="flex justify-between text-rose-500">
                <span>Statutory Deductions & Tax:</span>
                <span className="font-mono font-bold">-${selectedSlip.deductions + selectedSlip.taxAmount}</span>
              </div>
              <div className="flex justify-between font-extrabold text-sm border-t pt-2">
                <span>Net Salary Disbursed:</span>
                <span className="font-mono text-emerald-600">${selectedSlip.netSalary}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSelectedSlip(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 rounded-xl bg-brand-600 text-white font-bold inline-flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Payslip</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
