import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { useMyEmployeeQuery, useUpdateEmployeeDailyTaskMutation } from '../../api/employees';
import { useMyPreventiveTasksQuery } from '../../api/preventiveTasks';
import {
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  History,
  Camera,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Sparkles,
  DollarSign,
  Clock,
  Star,
  Check,
  Briefcase,
  Layers,
  Building,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export const HouseholdDashboard: React.FC = () => {
  const employeeQuery = useMyEmployeeQuery();
  const currentEmployee = employeeQuery.data;
  const preventiveTasksQuery = useMyPreventiveTasksQuery();
  const myPreventiveTasks = preventiveTasksQuery.data ?? [];
  const updateEmployeeDailyTaskMutation = useUpdateEmployeeDailyTaskMutation();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const myDailyTasks = currentEmployee?.dailyTasks || [];

  const pendingDailyTasks = myDailyTasks.filter((t) => t.status !== 'Completed');
  const completedDailyTasks = myDailyTasks.filter((t) => t.status === 'Completed');

  // Handle Mark Daily Task as Completed / In Progress
  const handleToggleTaskStatus = async (taskId: string, currentStatus: string) => {
    if (!currentEmployee) return;
    const nextStatus = currentStatus === 'Completed' ? 'In Progress' : 'Completed';
    try {
      await updateEmployeeDailyTaskMutation.mutateAsync({
        employeeId: currentEmployee.id,
        taskId,
        input: { status: nextStatus as any },
      });
      success(
        'Task Updated',
        nextStatus === 'Completed'
          ? 'Marked task as completed! Supervisor notified.'
          : 'Task marked in progress.'
      );
    } catch {
      toastError('Update Failed', 'Could not update this task.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 p-6 sm:p-8 text-white border border-slate-800 shadow-premium flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            {currentEmployee?.position || 'Facility Lead'} • Daily Operations
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display">
            Hello, {currentEmployee?.name?.split(' ')[0] || 'Emmanuel'} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Kigali Heights Residences & Compound Duty Roster
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/household/checklist"
            className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2"
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>Open Facility Checklist</span>
          </Link>
        </div>
      </div>

      {/* Quick Action Summary Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div
          onClick={() => navigate('/household/checklist')}
          className="glass-card p-6 rounded-3xl shadow-soft border hover:border-emerald-500 cursor-pointer transition-all space-y-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Facility Checklist</h3>
            <p className="text-xs text-slate-500">{myPreventiveTasks.length} checkpoint items assigned</p>
          </div>
          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
            Perform inspection <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>

        <div className="glass-card p-6 rounded-3xl shadow-soft border hover:border-brand-500 cursor-pointer transition-all space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-600 flex items-center justify-center">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Assigned Daily Tasks</h3>
            <p className="text-xs text-slate-500">
              {pendingDailyTasks.length} pending • {completedDailyTasks.length} done
            </p>
          </div>
          <span className="text-xs font-bold text-brand-600 flex items-center gap-1">
            See task work orders <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>

        <div
          onClick={() => navigate('/household/salary')}
          className="glass-card p-6 rounded-3xl shadow-soft border hover:border-purple-500 cursor-pointer transition-all space-y-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Salary & Payslips</h3>
            <p className="text-xs text-slate-500">Base Salary: ${currentEmployee?.basicSalary || 950} / mo</p>
          </div>
          <span className="text-xs font-bold text-purple-600 flex items-center gap-1">
            View salary slips <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SECTION 1: MY ASSIGNED DAILY TASKS & WORK ORDERS            */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl shadow-soft border space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 font-bold text-[10px] mb-1">
              <Briefcase className="w-3 h-3" />
              <span>Manager Dispatched Work Orders</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold font-display text-slate-900 dark:text-white">
              My Assigned Daily Tasks ({myDailyTasks.length})
            </h2>
            <p className="text-xs text-slate-500">
              Shift tasks assigned by Operations. Mark them done when finished to receive your rating.
            </p>
          </div>

          <span className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs border border-emerald-200 dark:border-emerald-800">
            {completedDailyTasks.length}/{myDailyTasks.length} Completed
          </span>
        </div>

        <div className="space-y-3">
          {myDailyTasks.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed text-slate-400 text-xs">
              No shift tasks currently assigned for today. You are all caught up!
            </div>
          ) : (
            myDailyTasks.map((task) => {
              const isCompleted = task.status === 'Completed';

              return (
                <div
                  key={task.id}
                  className={`p-5 rounded-2xl border transition-all space-y-3 ${
                    isCompleted
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                      : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 shadow-xs'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
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
                          {task.priority} Priority
                        </Badge>
                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                          {task.title}
                        </h3>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400">{task.description}</p>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
                        <span>Assigned: {task.assignedDate}</span>
                        <span>•</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          Due: {task.dueDate}
                        </span>
                        {task.propertyName && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Building className="w-3 h-3 text-slate-400" />
                              {task.propertyName} ({task.roomNumber || 'Common Areas'})
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Action Button: Mark Done / Undo */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleTaskStatus(task.id, task.status)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs ${
                          isCompleted
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-emerald-600 hover:text-white'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{isCompleted ? 'Completed ✓' : 'Mark as Done'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Supervisor Feedback & Star Score */}
                  {(task.managerComment || task.rating) && (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Supervisor Remark ({task.ratedBy || 'Operations'})
                        </span>
                        <p className="italic text-slate-700 dark:text-slate-300 text-xs mt-0.5">
                          &ldquo;{task.managerComment}&rdquo;
                        </p>
                      </div>
                      {task.rating && (
                        <div className="flex items-center gap-1 shrink-0 bg-amber-50 dark:bg-amber-950 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                          <span className="font-extrabold text-amber-700 dark:text-amber-300 text-xs">
                            {task.rating} / 5 Stars
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SECTION 2: FACILITY PREVENTIVE CHECKPOINTS SNAPSHOT         */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl shadow-soft border space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
              Weekly Preventive Checkpoints Snapshot
            </h3>
            <p className="text-xs text-slate-500">Kigali Heights Residences Compound</p>
          </div>
          <Link
            to="/household/checklist"
            className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
          >
            <span>Open Category Checklist</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {myPreventiveTasks.slice(0, 4).map((task) => (
            <div
              key={task.id}
              onClick={() => navigate('/household/checklist')}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-100/80 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="purple" size="sm">{task.category}</Badge>
                  <span className="text-[10px] text-slate-400 font-semibold">{task.frequency}</span>
                </div>
                <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{task.taskName}</p>
              </div>

              <Badge
                variant={task.status === 'pass' ? 'success' : task.status === 'needs_attention' ? 'warning' : 'neutral'}
                size="sm"
                dot
              >
                {task.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
