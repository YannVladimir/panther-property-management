import React, { useState } from 'react';
import { useActivityLogsQuery, ACTIVITY_LOG_MODULES } from '../../api/activityLogs';
import {
  History,
  Search,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  User,
  Shield,
  Filter,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export const ActivityLogPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');

  const logsQuery = useActivityLogsQuery({ module: moduleFilter !== 'all' ? moduleFilter : undefined });
  const activityLogs = logsQuery.data ?? [];

  const filteredLogs = activityLogs.filter((log) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        log.action.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.userName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200 dark:border-slate-800">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
          System Audit Trail
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 dark:text-white mt-1">
          Operational Activity Timeline
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Real-time chronological stream of booking approvals, rent payments, facility inspections, and tenant dispatches.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 rounded-2xl shadow-soft flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search activity audit logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
          >
            <option value="all">All System Modules</option>
            {ACTIVITY_LOG_MODULES.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Activity Timeline List */}
      <div className="glass-card p-6 rounded-3xl shadow-soft space-y-6">
        <div className="space-y-6 relative pl-6 before:content-[''] before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
          {filteredLogs.map((log) => (
            <div key={log.id} className="relative flex items-start gap-4">
              <div
                className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-4 border-white dark:border-slate-900 ${
                  log.type === 'success'
                    ? 'bg-emerald-500'
                    : log.type === 'warning'
                    ? 'bg-amber-500'
                    : log.type === 'critical'
                    ? 'bg-rose-500'
                    : 'bg-brand-500'
                }`}
              />
              <div className="flex-1 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">{log.action}</span>
                    <Badge variant="purple" size="sm">{log.module}</Badge>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {log.timestamp}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {log.details}
                </p>
                <div className="text-[10px] text-slate-400 pt-1 flex items-center gap-2">
                  <span className="font-semibold text-brand-600 dark:text-brand-400">{log.userName}</span>
                  <span>•</span>
                  <span>{log.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
