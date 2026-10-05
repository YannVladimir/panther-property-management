import React from 'react';
import { useMyPreventiveTasksQuery } from '../../api/preventiveTasks';
import { History, CheckCircle2, AlertTriangle, Camera, Clock, Building } from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export const HouseholdTaskHistoryPage: React.FC = () => {
  const tasksQuery = useMyPreventiveTasksQuery();
  const preventiveTasks = tasksQuery.data ?? [];

  const completedTasks = preventiveTasks.filter(
    (t) => t.status === 'pass' || t.status === 'needs_attention' || t.status === 'failed'
  );

  if (tasksQuery.isLoading) {
    return <div className="py-24 text-center text-sm text-slate-400">Loading your task history…</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="pb-6 border-b border-slate-200 dark:border-slate-800">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
          Inspection History & Audit
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 dark:text-white mt-1">
          Completed Preventive Tasks
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Log of completed inspections signed by Lead Facility Officer Emmanuel Habimana.
        </p>
      </div>

      <div className="space-y-4">
        {completedTasks.map((task) => (
          <div key={task.id} className="glass-card p-6 rounded-3xl shadow-soft space-y-3 border">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="purple" size="sm">{task.category}</Badge>
                  <span className="text-xs text-slate-400">Week {task.scheduleWeek}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{task.taskName}</h3>
              </div>
              <Badge
                variant={
                  task.status === 'pass' ? 'success' : task.status === 'needs_attention' ? 'warning' : 'danger'
                }
                size="md"
                dot
              >
                {task.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border">
              &ldquo;{task.remarks}&rdquo;
            </p>

            {task.evidencePhotos.length > 0 && (
              <div className="flex gap-2 pt-1">
                {task.evidencePhotos.map((p, i) => (
                  <img key={i} src={p} alt="Evidence" className="w-20 h-20 rounded-xl object-cover border" />
                ))}
              </div>
            )}

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>Date Completed: {task.lastCompletedDate}</span>
              <span>Inspector: {task.assignedStaffName}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
