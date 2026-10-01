import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import {
  Briefcase,
  User,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Shield,
  FileText,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Star,
  Upload,
  ArrowLeft,
  Eye,
  Camera,
  MapPin,
  Building,
  CreditCard,
  Sparkles,
  Layers,
  Award,
  ChevronRight,
  X,
  Check,
  Plane,
  Receipt,
  HeartPulse,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Pagination } from '../../components/common/Pagination';
import { Modal } from '../../components/common/Modal';
import {
  Employee,
  EmployeeDailyTask,
  EmployeeDocument,
  EmployeeDamage,
  EmployeeLeave,
  PayrollRecord,
  PaymentMethod,
} from '../../types';

export const EmployeeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    employees,
    properties,
    payrollRecords,
    updateEmployee,
    updateEmployeeStatus,
    addEmployeeDocument,
    deleteEmployeeDocument,
    addEmployeeDailyTask,
    updateEmployeeDailyTask,
    addEmployeeDamage,
    addEmployeeLeave,
    updateEmployeeLeave,
    addPayrollRecord,
  } = useData();
  const { success, error: toastError } = useToast();

  const employee = employees.find((e) => e.id === id);

  const [activeTab, setActiveTab] = useState<'tasks' | 'payroll' | 'leaves' | 'damages' | 'documents' | 'profile'>('tasks');

  // Status Change Modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<Employee['status']>('active');
  const [statusReason, setStatusReason] = useState('');

  // 1. Drawer: Assign Daily Task
  const [taskDrawerOpen, setTaskDrawerOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState<EmployeeDailyTask['priority']>('Medium');
  const [taskDueDate, setTaskDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [taskProperty, setTaskProperty] = useState(properties[0]?.name || 'Kigali Heights');
  const [taskRoom, setTaskRoom] = useState('All Common Areas');

  // 2. Drawer: Task Review & Rating
  const [reviewTask, setReviewTask] = useState<EmployeeDailyTask | null>(null);
  const [reviewStatus, setReviewStatus] = useState<EmployeeDailyTask['status']>('Completed');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewRating, setReviewRating] = useState<number>(5);

  // 3. Drawer: Record Staff Damage Incident (Matching Damage Form with Images)
  const [damageDrawerOpen, setDamageDrawerOpen] = useState(false);
  const [dmgItem, setDmgItem] = useState('');
  const [dmgType, setDmgType] = useState('Equipment Breakage');
  const [dmgDesc, setDmgDesc] = useState('');
  const [dmgCost, setDmgCost] = useState<number>(65);
  const [dmgDeduct, setDmgDeduct] = useState<boolean>(true);
  const [dmgDeductAmount, setDmgDeductAmount] = useState<number>(30);
  const [dmgProperty, setDmgProperty] = useState(properties[0]?.name || 'Kigali Heights Residences');
  const [dmgRoom, setDmgRoom] = useState('Unit A-204');
  const [dmgPhotos, setDmgPhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=80',
  ]);

  // 4. Drawer: Record Payroll Payment
  const [payrollDrawerOpen, setPayrollDrawerOpen] = useState(false);
  const [payPeriod, setPayPeriod] = useState('August 2026');
  const [payBasic, setPayBasic] = useState<number>(employee?.basicSalary || 950);
  const [payAllowances, setPayAllowances] = useState<number>(120);
  const [payBonuses, setPayBonuses] = useState<number>(50);
  const [payDeductions, setPayDeductions] = useState<number>(20);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('Bank Transfer');
  const [payReference, setPayReference] = useState(`SAL-${Date.now().toString().slice(-6)}`);
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payNotes, setPayNotes] = useState('Monthly regular staff compensation disbursement.');

  // 5. Drawer: Record Employee Leave
  const [leaveDrawerOpen, setLeaveDrawerOpen] = useState(false);
  const [leaveType, setLeaveType] = useState<EmployeeLeave['leaveType']>('Annual Leave');
  const [leaveStart, setLeaveStart] = useState(new Date().toISOString().split('T')[0]);
  const [leaveEnd, setLeaveEnd] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [leaveDays, setLeaveDays] = useState<number>(7);
  const [leaveReason, setLeaveReason] = useState('Standard annual leave entitlement');
  const [leaveStatus, setLeaveStatus] = useState<EmployeeLeave['status']>('Approved');

  // 6. Edit Profile Modal
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState(employee?.name || '');
  const [editPosition, setEditPosition] = useState(employee?.position || '');
  const [editDepartment, setEditDepartment] = useState<Employee['department']>(employee?.department || 'Operations');
  const [editSalary, setEditSalary] = useState<number>(employee?.basicSalary || 950);
  const [editContact, setEditContact] = useState(employee?.contact || '');
  const [editEmail, setEditEmail] = useState(employee?.email || '');
  const [editNationalId, setEditNationalId] = useState(employee?.nationalId || '');
  const [editAddress, setEditAddress] = useState(employee?.address || '');

  // Document Upload Modal
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState<EmployeeDocument['type']>('Employment Contract');
  const [docFileUrl, setDocFileUrl] = useState('');

  // Pagination states
  const [tasksPageIndex, setTasksPageIndex] = useState(1);
  const [tasksPageSize, setTasksPageSize] = useState(5);
  const [payPageIndex, setPayPageIndex] = useState(1);
  const [payPageSize, setPayPageSize] = useState(10);
  const [leavePageIndex, setLeavePageIndex] = useState(1);
  const [leavePageSize, setLeavePageSize] = useState(10);

  if (!employee) {
    return (
      <div className="p-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Employee Not Found</h2>
        <p className="text-slate-500 text-sm">The staff member requested could not be located in the HR registry.</p>
        <button
          onClick={() => navigate('/operations/hr-payroll')}
          className="px-4 py-2 bg-brand-600 text-white font-bold rounded-xl text-xs"
        >
          Return to HR & Payroll
        </button>
      </div>
    );
  }

  // Employee's related data
  const employeePayroll = useMemo(() => payrollRecords.filter((p) => p.employeeId === employee?.id), [payrollRecords, employee?.id]);
  const employeeTasks = useMemo(() => employee?.dailyTasks || [], [employee?.dailyTasks]);
  const employeeDocs = useMemo(() => employee?.documents || [], [employee?.documents]);
  const employeeDamages = useMemo(() => employee?.damages || [], [employee?.damages]);
  const employeeLeaves = useMemo(() => employee?.leaves || [], [employee?.leaves]);

  const pagedTasks = useMemo(() => {
    const start = (tasksPageIndex - 1) * tasksPageSize;
    return employeeTasks.slice(start, start + tasksPageSize);
  }, [employeeTasks, tasksPageIndex, tasksPageSize]);

  const pagedPayroll = useMemo(() => {
    const start = (payPageIndex - 1) * payPageSize;
    return employeePayroll.slice(start, start + payPageSize);
  }, [employeePayroll, payPageIndex, payPageSize]);

  const pagedLeaves = useMemo(() => {
    const start = (leavePageIndex - 1) * leavePageSize;
    return employeeLeaves.slice(start, start + leavePageSize);
  }, [employeeLeaves, leavePageIndex, leavePageSize]);

  const completedTasksCount = employeeTasks.filter((t) => t.status === 'Completed').length;
  const taskRate = employeeTasks.length > 0 ? Math.round((completedTasksCount / employeeTasks.length) * 100) : 100;
  const ratedTasks = employeeTasks.filter((t) => t.rating && t.rating > 0);
  const avgRating =
    ratedTasks.length > 0
      ? (ratedTasks.reduce((acc, t) => acc + (t.rating || 0), 0) / ratedTasks.length).toFixed(1)
      : '5.0';

  // Photo Upload Handler for Staff Damage Form
  const handleDmgPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setDmgPhotos((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  // Handle Status Update
  const handleUpdateStatus = (e: React.FormEvent) => {
    e.preventDefault();
    updateEmployeeStatus(employee.id, newStatus, statusReason);
    success('Status Updated', `Staff status updated to ${newStatus.toUpperCase()}`);
    setStatusModalOpen(false);
  };

  // Handle Edit Profile Details (e.g. Salary, Role, Contact)
  const handleSaveProfileEdit = (e: React.FormEvent) => {
    e.preventDefault();
    updateEmployee({
      ...employee,
      name: editName,
      position: editPosition,
      department: editDepartment,
      basicSalary: Number(editSalary),
      contact: editContact,
      email: editEmail,
      nationalId: editNationalId,
      address: editAddress,
    });
    success('Profile Updated', `Updated profile and salary settings for ${editName}.`);
    setEditProfileOpen(false);
  };

  // Handle Create Daily Task
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    addEmployeeDailyTask(employee.id, {
      title: taskTitle,
      description: taskDesc,
      priority: taskPriority,
      dueDate: taskDueDate,
      propertyName: taskProperty,
      roomNumber: taskRoom,
      status: 'Pending',
    });
    success('Task Assigned', `Assigned "${taskTitle}" to ${employee.name}`);
    setTaskDrawerOpen(false);
    setTaskTitle('');
    setTaskDesc('');
  };

  // Handle Review & Rank Task
  const handleSaveTaskReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTask) return;

    updateEmployeeDailyTask(employee.id, reviewTask.id, {
      status: reviewStatus,
      managerComment: reviewComment,
      rating: reviewRating,
      ratedBy: 'Eric Manzi (Operations Director)',
    });

    success(
      'Task Reviewed & Ranked',
      `Confirmed status as ${reviewStatus} with a score of ${reviewRating} ★.`
    );
    setReviewTask(null);
  };

  // Handle Upload Document
  const handleUploadDoc = (e: React.FormEvent) => {
    e.preventDefault();
    addEmployeeDocument(employee.id, {
      name: docName,
      type: docType,
      fileUrl: docFileUrl || 'https://example.com/document.pdf',
      size: '1.2 MB',
      status: 'Verified',
    });
    success('Document Attached', `Uploaded ${docType} to employee dossier.`);
    setDocModalOpen(false);
    setDocName('');
    setDocFileUrl('');
  };

  // Handle Log Damage (Matching damage management with images)
  const handleLogDamage = (e: React.FormEvent) => {
    e.preventDefault();
    addEmployeeDamage(employee.id, {
      incidentDate: new Date().toISOString().split('T')[0],
      item: dmgItem,
      description: `${dmgType}: ${dmgDesc}`,
      propertyName: dmgProperty,
      roomNumber: dmgRoom,
      estimatedCost: Number(dmgCost),
      deductedFromSalary: dmgDeduct,
      deductedAmount: dmgDeduct ? Number(dmgDeductAmount) : 0,
      status: dmgDeduct ? 'Deducted' : 'Investigating',
      photos: dmgPhotos,
    });
    success('Damage Logged', `Recorded incident for ${dmgItem} with ${dmgPhotos.length} photo(s).`);
    setDamageDrawerOpen(false);
    setDmgItem('');
    setDmgDesc('');
    setDmgPhotos([]);
  };

  // Handle Record / Disburse Payroll Payment
  const handleRecordPayroll = (e: React.FormEvent) => {
    e.preventDefault();
    const basic = Number(payBasic);
    const tax = Math.round((basic + payAllowances + payBonuses) * 0.15);
    const net = basic + payAllowances + payBonuses - payDeductions - tax;

    addPayrollRecord({
      employeeId: employee.id,
      employeeName: employee.name,
      position: employee.position,
      department: employee.department,
      period: payPeriod,
      basicSalary: basic,
      allowances: Number(payAllowances),
      bonuses: Number(payBonuses),
      deductions: Number(payDeductions),
      taxAmount: tax,
      netSalary: net,
      paymentDate: payDate,
      paymentStatus: 'Paid',
      paymentMethod: payMethod,
    });

    success('Payroll Recorded', `Recorded salary payout of $${net} via ${payMethod} (Ref: ${payReference}).`);
    setPayrollDrawerOpen(false);
  };

  // Handle Record Employee Leave
  const handleRecordLeave = (e: React.FormEvent) => {
    e.preventDefault();
    addEmployeeLeave(employee.id, {
      leaveType,
      startDate: leaveStart,
      endDate: leaveEnd,
      daysCount: Number(leaveDays),
      reason: leaveReason,
      status: leaveStatus,
      approvedBy: 'Eric Manzi (Operations Director)',
    });

    success(
      'Leave Recorded',
      `Recorded ${leaveType} (${leaveDays} days). Employee status updated to ${leaveStatus === 'Approved' ? 'ON LEAVE' : 'ACTIVE'}.`
    );
    setLeaveDrawerOpen(false);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/operations/hr-payroll"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-brand-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Staff Directory & Payroll</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditName(employee.name);
              setEditPosition(employee.position);
              setEditDepartment(employee.department);
              setEditSalary(employee.basicSalary);
              setEditContact(employee.contact);
              setEditEmail(employee.email);
              setEditNationalId(employee.nationalId);
              setEditAddress(employee.address || '');
              setEditProfileOpen(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors inline-flex items-center gap-1.5"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Profile & Salary</span>
          </button>

          <button
            onClick={() => {
              setNewStatus(employee.status || 'active');
              setStatusReason(employee.statusReason || '');
              setStatusModalOpen(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-bold text-xs border border-brand-200 dark:border-brand-800 transition-colors"
          >
            Change Status
          </button>
        </div>
      </div>

      {/* Hero Employee Profile Card */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border shadow-soft bg-gradient-to-br from-white via-white to-slate-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <img
                src={employee.avatar}
                alt={employee.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover border-2 border-brand-500 shadow-md"
              />
              <span
                className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-2 border-white dark:border-slate-800 ${
                  employee.status === 'active'
                    ? 'bg-emerald-500'
                    : employee.status === 'on_leave'
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-rose-500'
                }`}
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 dark:text-white">
                  {employee.name}
                </h1>
                <Badge
                  variant={
                    employee.status === 'active'
                      ? 'success'
                      : employee.status === 'on_leave'
                      ? 'warning'
                      : 'danger'
                  }
                  size="sm"
                  dot
                >
                  {(employee.status || 'active').toUpperCase().replace('_', ' ')}
                </Badge>
              </div>

              <p className="text-sm font-bold text-brand-600 dark:text-brand-400">
                {employee.position} • <span className="text-slate-500 font-medium">{employee.department} Dept</span>
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {employee.contact}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {employee.email}
                </span>
                <span className="flex items-center gap-1 font-mono">
                  <Shield className="w-3.5 h-3.5 text-slate-400" />
                  NID: {employee.nationalId}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 w-full md:w-auto shrink-0">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">Base Salary</span>
              <p className="text-lg font-extrabold font-mono text-emerald-600">${employee.basicSalary}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">Task Score</span>
              <p className="text-lg font-extrabold font-mono text-brand-600">{avgRating} ★</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">Completion</span>
              <p className="text-lg font-extrabold font-mono text-sky-600">{taskRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'tasks'
              ? 'bg-brand-600 text-white shadow-md'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
          }`}
        >
          Daily Tasks & Shifts ({employeeTasks.length})
        </button>

        <button
          onClick={() => setActiveTab('payroll')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'payroll'
              ? 'bg-brand-600 text-white shadow-md'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
          }`}
        >
          Payroll & Compensation ({employeePayroll.length})
        </button>

        <button
          onClick={() => setActiveTab('leaves')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'leaves'
              ? 'bg-brand-600 text-white shadow-md'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
          }`}
        >
          Leaves & Time Off ({employeeLeaves.length})
        </button>

        <button
          onClick={() => setActiveTab('damages')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'damages'
              ? 'bg-brand-600 text-white shadow-md'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
          }`}
        >
          Damages & Incidents ({employeeDamages.length})
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'documents'
              ? 'bg-brand-600 text-white shadow-md'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
          }`}
        >
          Documents & Files ({employeeDocs.length})
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'profile'
              ? 'bg-brand-600 text-white shadow-md'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
          }`}
        >
          Profile Details
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB 1: DAILY TASKS & WORK ORDERS                           */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'tasks' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-extrabold font-display text-slate-900 dark:text-white">
                Daily Work Orders & Shift Tasks
              </h3>
              <p className="text-xs text-slate-500">
                Assign daily property tasks, verify completion, add supervisor remarks, and rank performance quality.
              </p>
            </div>

            <button
              onClick={() => setTaskDrawerOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Assign Daily Task</span>
            </button>
          </div>

          <div className="space-y-3">
            {employeeTasks.length === 0 ? (
              <div className="p-8 text-center glass-card rounded-2xl border text-slate-400 text-xs">
                No daily tasks currently assigned to {employee.name}. Click &quot;Assign Daily Task&quot; above to dispatch work.
              </div>
            ) : (
              pagedTasks.map((t) => (
                <div
                  key={t.id}
                  className="glass-card p-5 rounded-2xl border shadow-soft space-y-3 transition-all hover:border-brand-300"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            t.priority === 'High'
                              ? 'danger'
                              : t.priority === 'Medium'
                              ? 'warning'
                              : 'neutral'
                          }
                          size="sm"
                        >
                          {t.priority} Priority
                        </Badge>
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                          {t.title}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{t.description}</p>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
                        <span>Assigned: {t.assignedDate}</span>
                        <span>•</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          Due: {t.dueDate}
                        </span>
                        {t.propertyName && (
                          <>
                            <span>•</span>
                            <span>{t.propertyName} ({t.roomNumber || 'Common Areas'})</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant={
                          t.status === 'Completed'
                            ? 'success'
                            : t.status === 'In Progress'
                            ? 'warning'
                            : 'neutral'
                        }
                        size="sm"
                        dot
                      >
                        {t.status.toUpperCase()}
                      </Badge>
                      <button
                        onClick={() => {
                          setReviewTask(t);
                          setReviewStatus(t.status);
                          setReviewComment(t.managerComment || '');
                          setReviewRating(t.rating || 5);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-brand-600 hover:text-white font-bold text-xs transition-colors"
                      >
                        Review & Rank
                      </button>
                    </div>
                  </div>

                  {/* Supervisor Ranking & Feedback Banner */}
                  {(t.managerComment || t.rating) && (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <span className="font-bold text-[10px] uppercase text-slate-400">
                          Supervisor Feedback ({t.ratedBy || 'Operations'})
                        </span>
                        <p className="italic text-slate-700 dark:text-slate-300">&ldquo;{t.managerComment}&rdquo;</p>
                      </div>
                      {t.rating && (
                        <div className="flex items-center gap-1 shrink-0 bg-amber-50 dark:bg-amber-950 px-2 py-1 rounded-lg border border-amber-200 dark:border-amber-800">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                          <span className="font-extrabold text-amber-700 dark:text-amber-300 text-xs">
                            {t.rating} / 5
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB 2: PAYROLL & SALARY DISBURSEMENT                        */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'payroll' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-extrabold font-display text-slate-900 dark:text-white">
                Monthly Salary & Compensation Ledger
              </h3>
              <p className="text-xs text-slate-500">
                Official salary disbursement slips, tax breakdowns, allowances, and statutory deductions.
              </p>
            </div>

            <button
              onClick={() => {
                setPayBasic(employee.basicSalary);
                setPayrollDrawerOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
            >
              <DollarSign className="w-4 h-4" />
              <span>Record Salary Payment</span>
            </button>
          </div>

          <div className="glass-card rounded-3xl shadow-soft overflow-hidden border">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold text-[10px] bg-slate-50/50 dark:bg-slate-800/30">
                    <th className="py-3.5 px-6">Slip #</th>
                    <th className="py-3.5 px-4">Period</th>
                    <th className="py-3.5 px-4">Basic Pay</th>
                    <th className="py-3.5 px-4">Allowances</th>
                    <th className="py-3.5 px-4">Deductions</th>
                    <th className="py-3.5 px-4">Net Payout</th>
                    <th className="py-3.5 px-4">Payment Method</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-6 text-right">Payment Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {employeePayroll.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        No previous salary disbursements generated for {employee.name}.
                      </td>
                    </tr>
                  ) : (
                    pagedPayroll.map((pay) => (
                      <tr key={pay.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="py-4 px-6 font-mono font-bold text-slate-900 dark:text-white">
                          {pay.payrollNumber}
                        </td>
                        <td className="py-4 px-4 font-bold">{pay.period}</td>
                        <td className="py-4 px-4 font-mono">${pay.basicSalary}</td>
                        <td className="py-4 px-4 font-mono text-emerald-600">+${pay.allowances + pay.bonuses}</td>
                        <td className="py-4 px-4 font-mono text-rose-500">-${pay.deductions + pay.taxAmount}</td>
                        <td className="py-4 px-4 font-extrabold font-mono text-sm text-emerald-600">
                          ${pay.netSalary}
                        </td>
                        <td className="py-4 px-4">{pay.paymentMethod}</td>
                        <td className="py-4 px-4">
                          <Badge variant="success" size="sm" dot>
                            {pay.paymentStatus.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-4 px-6 text-right font-mono text-slate-500">{pay.paymentDate}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={payPageIndex}
              totalItems={employeePayroll.length}
              pageSize={payPageSize}
              onPageChange={(p) => setPayPageIndex(p)}
              onPageSizeChange={(s) => { setPayPageSize(s); setPayPageIndex(1); }}
            />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB 3: LEAVES & TIME OFF                                    */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'leaves' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-extrabold font-display text-slate-900 dark:text-white">
                Leave & Absence Management
              </h3>
              <p className="text-xs text-slate-500">
                Track employee annual leave, sick leave, and maternity/paternity with automatic on-leave status switching.
              </p>
            </div>

            <button
              onClick={() => setLeaveDrawerOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md"
            >
              <Plane className="w-4 h-4" />
              <span>Record Employee Leave</span>
            </button>
          </div>

          <div className="glass-card rounded-3xl shadow-soft overflow-hidden border">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold text-[10px] bg-slate-50/50 dark:bg-slate-800/30">
                    <th className="py-3.5 px-6">Leave Category</th>
                    <th className="py-3.5 px-4">Start Date</th>
                    <th className="py-3.5 px-4">End Date</th>
                    <th className="py-3.5 px-4">Duration</th>
                    <th className="py-3.5 px-4">Reason / Notes</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-6 text-right">Approved By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {employeeLeaves.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No leave records logged for {employee.name}. Click &quot;Record Employee Leave&quot; above to log an absence.
                      </td>
                    </tr>
                  ) : (
                    pagedLeaves.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="py-4 px-6 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <Plane className="w-4 h-4 text-brand-600" />
                          <span>{l.leaveType}</span>
                        </td>
                        <td className="py-4 px-4 font-mono font-medium">{l.startDate}</td>
                        <td className="py-4 px-4 font-mono font-medium">{l.endDate}</td>
                        <td className="py-4 px-4 font-extrabold text-brand-600">{l.daysCount} Days</td>
                        <td className="py-4 px-4 italic text-slate-500">{l.reason}</td>
                        <td className="py-4 px-4">
                          <Badge
                            variant={
                              l.status === 'Approved'
                                ? 'success'
                                : l.status === 'Pending'
                                ? 'warning'
                                : 'neutral'
                            }
                            size="sm"
                            dot
                          >
                            {l.status.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-4 px-6 text-right font-medium text-slate-500">
                          {l.approvedBy || 'Eric Manzi'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={leavePageIndex}
              totalItems={employeeLeaves.length}
              pageSize={leavePageSize}
              onPageChange={(p) => setLeavePageIndex(p)}
              onPageSizeChange={(s) => { setLeavePageSize(s); setLeavePageIndex(1); }}
            />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB 4: DAMAGES & INCIDENTS (MATCHING DAMAGE FORM WITH IMAGES) */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'damages' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-extrabold font-display text-slate-900 dark:text-white">
                Equipment Damages & Property Incidents
              </h3>
              <p className="text-xs text-slate-500">
                Log equipment breakage or property incidents caused by staff with photo proof and salary deduction tracking.
              </p>
            </div>

            <button
              onClick={() => {
                setDmgPhotos([]);
                setDamageDrawerOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Log Incident / Damage</span>
            </button>
          </div>

          <div className="space-y-3">
            {employeeDamages.length === 0 ? (
              <div className="p-8 text-center glass-card rounded-2xl border text-slate-400 text-xs">
                Clean record — no damages or liability incidents logged for {employee.name}.
              </div>
            ) : (
              employeeDamages.map((dmg) => (
                <div key={dmg.id} className="glass-card p-5 rounded-2xl border shadow-soft space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{dmg.item}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{dmg.description}</p>
                    </div>
                    <Badge variant={dmg.status === 'Deducted' ? 'danger' : 'warning'} size="sm">
                      {dmg.status}
                    </Badge>
                  </div>

                  {dmg.photos && dmg.photos.length > 0 && (
                    <div className="flex items-center gap-2 pt-1">
                      {dmg.photos.map((p, idx) => (
                        <img
                          key={idx}
                          src={p}
                          alt="Damage photo proof"
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                        />
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <span className="text-slate-400">Date: {dmg.incidentDate} • {dmg.propertyName}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500">Est. Repair: <strong>${dmg.estimatedCost}</strong></span>
                      {dmg.deductedFromSalary && (
                        <span className="font-extrabold text-rose-500">
                          Salary Deducted: -${dmg.deductedAmount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB 5: DOCUMENTS & VERIFICATION                             */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-extrabold font-display text-slate-900 dark:text-white">
                Employee Personnel Files & Compliance Documents
              </h3>
              <p className="text-xs text-slate-500">
                Verified employment contracts, National ID cards, professional certificates, and criminal clearance records.
              </p>
            </div>

            <button
              onClick={() => setDocModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Document</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {employeeDocs.length === 0 ? (
              <div className="col-span-full p-8 text-center glass-card rounded-2xl border text-slate-400 text-xs">
                No HR documents attached for this employee yet. Click &quot;Upload Document&quot; above.
              </div>
            ) : (
              employeeDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="glass-card p-4 rounded-2xl border shadow-soft space-y-3 relative group"
                >
                  <div className="flex items-start justify-between">
                    <div className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
                      <FileText className="w-5 h-5" />
                    </div>
                    <Badge variant="success" size="sm">
                      {doc.status}
                    </Badge>
                  </div>

                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">{doc.name}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{doc.type}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
                    <span>Uploaded: {doc.uploadDate}</span>
                    <button
                      onClick={() => deleteEmployeeDocument(employee.id, doc.id)}
                      className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                      title="Delete document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB 6: PROFILE & CONTRACT DETAILS                           */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'profile' && (
        <div className="glass-card p-6 rounded-3xl border shadow-soft space-y-6 text-xs text-slate-700 dark:text-slate-300">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold font-display text-slate-900 dark:text-white">
              Employee Profile & Compensation Breakdown
            </h3>
            <button
              onClick={() => {
                setEditName(employee.name);
                setEditPosition(employee.position);
                setEditDepartment(employee.department);
                setEditSalary(employee.basicSalary);
                setEditContact(employee.contact);
                setEditEmail(employee.email);
                setEditNationalId(employee.nationalId);
                setEditAddress(employee.address || '');
                setEditProfileOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-700 transition-colors inline-flex items-center gap-1.5"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <span className="font-bold uppercase text-[10px] text-slate-400 block mb-0.5">Full Name</span>
                <p className="font-extrabold text-slate-900 dark:text-white text-sm">{employee.name}</p>
              </div>

              <div>
                <span className="font-bold uppercase text-[10px] text-slate-400 block mb-0.5">Position & Role</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">{employee.position}</p>
              </div>

              <div>
                <span className="font-bold uppercase text-[10px] text-slate-400 block mb-0.5">Department</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">{employee.department}</p>
              </div>

              <div>
                <span className="font-bold uppercase text-[10px] text-slate-400 block mb-0.5">Employment Type</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">{employee.employmentStatus}</p>
              </div>

              <div>
                <span className="font-bold uppercase text-[10px] text-slate-400 block mb-0.5">Start Date</span>
                <p className="font-mono">{employee.startDate}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <span className="font-bold uppercase text-[10px] text-slate-400 block mb-0.5">National ID Number</span>
                <p className="font-mono font-bold text-slate-900 dark:text-white">{employee.nationalId}</p>
              </div>

              <div>
                <span className="font-bold uppercase text-[10px] text-slate-400 block mb-0.5">Monthly Basic Salary</span>
                <p className="font-extrabold font-mono text-emerald-600 text-base">${employee.basicSalary}</p>
              </div>

              <div>
                <span className="font-bold uppercase text-[10px] text-slate-400 block mb-0.5">Residential Address</span>
                <p>{employee.address || 'Kigali, Rwanda'}</p>
              </div>

              <div>
                <span className="font-bold uppercase text-[10px] text-slate-400 block mb-0.5">Emergency Contact</span>
                <p>
                  {employee.emergencyContact
                    ? `${employee.emergencyContact.name} (${employee.emergencyContact.relationship}) — ${employee.emergencyContact.phone}`
                    : 'None registered'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 1. SLIDE-IN SIDE PANEL: ASSIGN DAILY TASK                   */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div
        className={`fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300 ${
          taskDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setTaskDrawerOpen(false)}
      />

      <aside
        className={`fixed right-0 top-0 h-full z-50 w-full max-w-xl bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out ${
          taskDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 font-bold text-[10px] mb-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Shift Work Order Dispatch</span>
            </div>
            <h2 className="text-lg font-extrabold font-display text-slate-900 dark:text-white">
              Assign Daily Task to {employee.name}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Specify task title, instructions, location, and due date.
            </p>
          </div>
          <button
            onClick={() => setTaskDrawerOpen(false)}
            className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCreateTask} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-700 dark:text-slate-300">
          {/* Task Core Information */}
          <div className="space-y-3">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Task Details & Directives *
            </label>
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Task Title *
              </label>
              <input
                type="text"
                required
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="e.g. Inspect Backup Generator Fuel Level & Air Filters"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Task Description & Instructions
              </label>
              <textarea
                rows={3}
                value={taskDesc}
                onChange={(e) => setTaskDesc(e.target.value)}
                placeholder="Provide detailed step-by-step instructions for the staff member..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white text-xs placeholder:text-slate-400 resize-none focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Execution & Deadlines */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Priority & Deadlines *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">
                  Priority Level *
                </label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                >
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">
                  Due Date *
                </label>
                <input
                  type="date"
                  required
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">
                  Estate Location
                </label>
                <select
                  value={taskProperty}
                  onChange={(e) => setTaskProperty(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">
                  Unit / Area
                </label>
                <input
                  type="text"
                  value={taskRoom}
                  onChange={(e) => setTaskRoom(e.target.value)}
                  placeholder="e.g. Generator Room B"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setTaskDrawerOpen(false)}
              className="px-4 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-md transition-all flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Dispatch Daily Task</span>
            </button>
          </div>
        </form>
      </aside>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 2. SLIDE-IN SIDE PANEL: REVIEW & RANK TASK QUALITY          */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div
        className={`fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300 ${
          Boolean(reviewTask) ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setReviewTask(null)}
      />

      <aside
        className={`fixed right-0 top-0 h-full z-50 w-full max-w-xl bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out ${
          Boolean(reviewTask) ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold text-[10px] mb-1">
              <Star className="w-3 h-3 text-amber-500" />
              <span>Supervisor Performance Assessment</span>
            </div>
            <h2 className="text-lg font-extrabold font-display text-slate-900 dark:text-white">
              Review & Rank Task
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Confirm task completion, provide comments, and rank execution quality (1-5 Stars).
            </p>
          </div>
          <button
            onClick={() => setReviewTask(null)}
            className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {reviewTask && (
          <form onSubmit={handleSaveTaskReview} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-700 dark:text-slate-300">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Task Title</span>
              <p className="font-bold text-slate-900 dark:text-white text-sm">{reviewTask.title}</p>
              <p className="text-[11px] text-slate-500">{reviewTask.description}</p>
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Completion Status *
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setReviewStatus('Completed')}
                  className={`py-2.5 rounded-xl font-bold text-xs border transition-all ${
                    reviewStatus === 'Completed'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Completed ✓
                </button>
                <button
                  type="button"
                  onClick={() => setReviewStatus('In Progress')}
                  className={`py-2.5 rounded-xl font-bold text-xs border transition-all ${
                    reviewStatus === 'In Progress'
                      ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  In Progress
                </button>
                <button
                  type="button"
                  onClick={() => setReviewStatus('Rejected')}
                  className={`py-2.5 rounded-xl font-bold text-xs border transition-all ${
                    reviewStatus === 'Rejected'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Rejected
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Performance Rating (1 to 5 Stars) *
              </label>
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="p-1 hover:scale-125 transition-transform"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= reviewRating
                          ? 'fill-amber-400 text-amber-500'
                          : 'text-slate-300 dark:text-slate-600'
                      }`}
                    />
                  </button>
                ))}
                <span className="font-extrabold text-sm ml-2 text-slate-900 dark:text-white">
                  {reviewRating} Stars
                </span>
              </div>
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">
                Supervisor Feedback & Remarks *
              </label>
              <textarea
                rows={4}
                required
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Describe quality observations, speed, cleanliness, follow-up..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border font-medium resize-none"
              />
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setReviewTask(null)}
                className="px-4 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md transition-all flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Save Review & Score</span>
              </button>
            </div>
          </form>
        )}
      </aside>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 3. SLIDE-IN SIDE PANEL: RECORD STAFF DAMAGE (MATCHING FORM) */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div
        className={`fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300 ${
          damageDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setDamageDrawerOpen(false)}
      />

      <aside
        className={`fixed right-0 top-0 h-full z-50 w-full max-w-xl bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out ${
          damageDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold text-[10px] mb-1">
              <AlertTriangle className="w-3 h-3 text-amber-500" />
              <span>Staff Equipment Liability Filing</span>
            </div>
            <h2 className="text-lg font-extrabold font-display text-slate-900 dark:text-white">
              Log Staff Damage Incident
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Record broken asset, estimated repair cost, photo evidence, and payroll deduction option.
            </p>
          </div>
          <button
            onClick={() => setDamageDrawerOpen(false)}
            className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleLogDamage} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-700 dark:text-slate-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">
                Property Estate *
              </label>
              <select
                value={dmgProperty}
                onChange={(e) => setDmgProperty(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border font-bold"
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">
                Unit / Area Location
              </label>
              <input
                type="text"
                value={dmgRoom}
                onChange={(e) => setDmgRoom(e.target.value)}
                placeholder="e.g. Unit A-204"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">
                Damaged Item / Asset *
              </label>
              <input
                type="text"
                required
                value={dmgItem}
                onChange={(e) => setDmgItem(e.target.value)}
                placeholder="e.g. Industrial Floor Polisher Motor"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border font-bold"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">
                Damage Classification *
              </label>
              <input
                type="text"
                required
                value={dmgType}
                onChange={(e) => setDmgType(e.target.value)}
                placeholder="e.g. Overheated motor bearing"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">
                Estimated Repair Cost ($) *
              </label>
              <input
                type="number"
                required
                min={0}
                value={dmgCost}
                onChange={(e) => setDmgCost(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border font-extrabold font-mono text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">
                Salary Deduction Amount ($)
              </label>
              <input
                type="number"
                min={0}
                value={dmgDeductAmount}
                onChange={(e) => setDmgDeductAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 font-extrabold font-mono text-rose-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border">
            <input
              type="checkbox"
              id="dmgDeductToggle"
              checked={dmgDeduct}
              onChange={(e) => setDmgDeduct(e.target.checked)}
              className="rounded text-brand-600 focus:ring-brand-500"
            />
            <label htmlFor="dmgDeductToggle" className="font-semibold text-slate-700 dark:text-slate-300">
              Recover deduction from next monthly payroll disbursement
            </label>
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">
              Incident Description & Circumstances *
            </label>
            <textarea
              rows={3}
              required
              value={dmgDesc}
              onChange={(e) => setDmgDesc(e.target.value)}
              placeholder="Detail what caused the damage, parts required for repair..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border font-medium resize-none"
            />
          </div>

          {/* Multiple Photo Upload Component */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block font-bold uppercase tracking-wider text-slate-500">
                Damage Photos Proof ({dmgPhotos.length})
              </label>
              <span className="text-[10px] text-slate-400">JPG, PNG supported</span>
            </div>

            {dmgPhotos.length > 0 && (
              <div className="grid grid-cols-3 gap-2.5 mb-3">
                {dmgPhotos.map((p, idx) => (
                  <div
                    key={idx}
                    className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 group h-24 bg-slate-100 dark:bg-slate-800"
                  >
                    <img
                      src={p}
                      alt={`Damage photo ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1">
                      <button
                        type="button"
                        onClick={() => setDmgPhotos((prev) => prev.filter((_, i) => i !== idx))}
                        title="Remove photo"
                        className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <label className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-amber-500 hover:bg-amber-50/40 dark:hover:bg-amber-950/20 transition-all cursor-pointer text-center group">
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform mb-1">
                <Upload className="w-4 h-4" />
              </div>
              <span className="font-bold text-xs text-slate-700 dark:text-slate-200">
                Click or Drag to Upload Damage Photos
              </span>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleDmgPhotoUpload}
              />
            </label>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setDamageDrawerOpen(false)}
              className="px-4 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md transition-all flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Log Incident Record</span>
            </button>
          </div>
        </form>
      </aside>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 4. SLIDE-IN SIDE PANEL: RECORD PAYROLL PAYMENT              */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div
        className={`fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300 ${
          payrollDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setPayrollDrawerOpen(false)}
      />

      <aside
        className={`fixed right-0 top-0 h-full z-50 w-full max-w-xl bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out ${
          payrollDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] mb-1">
              <DollarSign className="w-3 h-3" />
              <span>Operations Payroll Disbursement</span>
            </div>
            <h2 className="text-lg font-extrabold font-display text-slate-900 dark:text-white">
              Record Salary Payment
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Disburse monthly compensation for {employee.name} and record transaction.
            </p>
          </div>
          <button
            onClick={() => setPayrollDrawerOpen(false)}
            className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleRecordPayroll} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-700 dark:text-slate-300">
          {/* Period & Payment Date */}
          <div className="space-y-3">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Disbursement Cycle & Channel *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">
                  Pay Period *
                </label>
                <input
                  type="text"
                  required
                  value={payPeriod}
                  onChange={(e) => setPayPeriod(e.target.value)}
                  placeholder="e.g. August 2026"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">
                  Payment Date *
                </label>
                <input
                  type="date"
                  required
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">
                  Basic Salary ($) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={payBasic}
                  onChange={(e) => setPayBasic(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-extrabold text-emerald-600 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">
                  Payment Method *
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                >
                  <option value="Bank Transfer">Bank Transfer (BK / Equity)</option>
                  <option value="Mobile Money">Mobile Money (MTN / Airtel)</option>
                  <option value="Cash">Cash at Office</option>
                </select>
              </div>
            </div>
          </div>

          {/* Adjustments */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Allowances & Deductions
            </label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">
                  Allowances ($)
                </label>
                <input
                  type="number"
                  min={0}
                  value={payAllowances}
                  onChange={(e) => setPayAllowances(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-emerald-600 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">
                  Bonus ($)
                </label>
                <input
                  type="number"
                  min={0}
                  value={payBonuses}
                  onChange={(e) => setPayBonuses(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-emerald-600 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">
                  Deductions ($)
                </label>
                <input
                  type="number"
                  min={0}
                  value={payDeductions}
                  onChange={(e) => setPayDeductions(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-rose-500 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Transaction Reference / Slip Code *
              </label>
              <input
                type="text"
                required
                value={payReference}
                onChange={(e) => setPayReference(e.target.value)}
                placeholder="e.g. BK-TX-998124"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Net Computed Box */}
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
            <div>
              <span className="font-bold text-[11px] text-emerald-800 dark:text-emerald-300">
                Net Disbursed Amount
              </span>
              <p className="text-[10px] text-slate-500">Includes 15% estimated PAYE withholding tax</p>
            </div>
            <p className="text-2xl font-extrabold font-mono text-emerald-600">
              $
              {payBasic +
                payAllowances +
                payBonuses -
                payDeductions -
                Math.round((payBasic + payAllowances + payBonuses) * 0.15)}
            </p>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setPayrollDrawerOpen(false)}
              className="px-4 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md transition-all flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Record & Disburse Payout</span>
            </button>
          </div>
        </form>
      </aside>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 5. SLIDE-IN SIDE PANEL: RECORD EMPLOYEE LEAVE               */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div
        className={`fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300 ${
          leaveDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setLeaveDrawerOpen(false)}
      />

      <aside
        className={`fixed right-0 top-0 h-full z-50 w-full max-w-xl bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out ${
          leaveDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 font-bold text-[10px] mb-1">
              <Plane className="w-3 h-3" />
              <span>Staff Leave Schedule</span>
            </div>
            <h2 className="text-lg font-extrabold font-display text-slate-900 dark:text-white">
              Record Leave for {employee.name}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Log absence dates and automatically update staff status to On Leave.
            </p>
          </div>
          <button
            onClick={() => setLeaveDrawerOpen(false)}
            className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleRecordLeave} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-700 dark:text-slate-300">
          {/* Leave Classification */}
          <div className="space-y-3">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Leave Details & Scheduling *
            </label>
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Leave Category *
              </label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              >
                <option value="Annual Leave">Annual Leave (Congé Annuel)</option>
                <option value="Sick Leave">Sick Leave (Medical Certificate)</option>
                <option value="Maternity / Paternity">Maternity / Paternity</option>
                <option value="Compassionate Leave">Compassionate Leave</option>
                <option value="Unpaid Leave">Unpaid Leave</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={leaveStart}
                  onChange={(e) => setLeaveStart(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">
                  End Date *
                </label>
                <input
                  type="date"
                  required
                  value={leaveEnd}
                  onChange={(e) => setLeaveEnd(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">
                  Total Days *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={leaveDays}
                  onChange={(e) => setLeaveDays(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">
                  Approval Status *
                </label>
                <select
                  value={leaveStatus}
                  onChange={(e) => setLeaveStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                >
                  <option value="Approved">Approved (Sets status to On Leave)</option>
                  <option value="Pending">Pending Review</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Reason & Notes *
              </label>
              <textarea
                rows={3}
                required
                value={leaveReason}
                onChange={(e) => setLeaveReason(e.target.value)}
                placeholder="e.g. Approved 2-week annual leave for family travel..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white text-xs placeholder:text-slate-400 resize-none focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setLeaveDrawerOpen(false)}
              className="px-4 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-md transition-all flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Record & Apply Leave</span>
            </button>
          </div>
        </form>
      </aside>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 6. SLIDE-IN SIDE PANEL: EDIT PROFILE & SALARY               */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div
        className={`fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300 ${
          editProfileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setEditProfileOpen(false)}
      />

      <aside
        className={`fixed right-0 top-0 h-full z-50 w-full max-w-xl bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out ${
          editProfileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 font-bold text-[10px] mb-1">
              <User className="w-3 h-3" />
              <span>Personnel Information Editor</span>
            </div>
            <h2 className="text-lg font-extrabold font-display text-slate-900 dark:text-white">
              Edit Profile & Salary: {employee.name}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Modify basic salary, job role, department, and contact details.
            </p>
          </div>
          <button
            onClick={() => setEditProfileOpen(false)}
            className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSaveProfileEdit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-700 dark:text-slate-300">
          {/* Profile Identity */}
          <div className="space-y-3">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Identity & Role Information *
            </label>
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Full Legal Name *
              </label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">
                  Position / Role *
                </label>
                <input
                  type="text"
                  required
                  value={editPosition}
                  onChange={(e) => setEditPosition(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">
                  Department *
                </label>
                <select
                  value={editDepartment}
                  onChange={(e) => setEditDepartment(e.target.value as any)}
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

          {/* Salary & Contact */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Salary & Contact Particulars *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">
                  Monthly Basic Salary ($) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={editSalary}
                  onChange={(e) => setEditSalary(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-extrabold font-mono text-emerald-600 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">
                  National ID Number *
                </label>
                <input
                  type="text"
                  required
                  value={editNationalId}
                  onChange={(e) => setEditNationalId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">
                  Contact Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={editContact}
                  onChange={(e) => setEditContact(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Residential Address
              </label>
              <input
                type="text"
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditProfileOpen(false)}
              className="px-4 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-md transition-all flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </aside>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MODAL: CHANGE EMPLOYEE STATUS                               */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {statusModalOpen && (
        <Modal
          isOpen={statusModalOpen}
          onClose={() => setStatusModalOpen(false)}
          title={`Update Employment Status`}
          subtitle={`Set active employment or leave state for ${employee.name}`}
        >
          <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs">
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                New Employment Status *
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              >
                <option value="active">Active (On Duty)</option>
                <option value="on_leave">On Leave (Annual / Sick Leave)</option>
                <option value="suspended">Suspended</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Reason / Status Notes
              </label>
              <textarea
                rows={2}
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="e.g. Approved 2-week annual leave through Sept 1st..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white text-xs placeholder:text-slate-400 resize-none focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStatusModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-500 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition-all"
              >
                Save Status Update
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MODAL: UPLOAD COMPLIANCE DOCUMENT                           */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {docModalOpen && (
        <Modal
          isOpen={docModalOpen}
          onClose={() => setDocModalOpen(false)}
          title="Upload Personnel Document"
          subtitle={`Attach official compliance documentation for ${employee.name}`}
        >
          <form onSubmit={handleUploadDoc} className="space-y-4 text-xs">
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Document Classification *
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              >
                <option value="Employment Contract">Employment Contract</option>
                <option value="National ID / Passport">National ID / Passport</option>
                <option value="Criminal Record Clearance">Criminal Record Clearance</option>
                <option value="Health Insurance">Health Insurance (RAMA / RSSB)</option>
                <option value="Certificate / Degree">Certificate / Degree</option>
                <option value="Other">Other Document</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Document File Name *
              </label>
              <input
                type="text"
                required
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                placeholder="e.g. Signed_Contract_2026.pdf"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Document URL / Path
              </label>
              <input
                type="text"
                value={docFileUrl}
                onChange={(e) => setDocFileUrl(e.target.value)}
                placeholder="https://example.com/contract.pdf"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[11px] text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDocModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-500 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition-all"
              >
                Save Document
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
