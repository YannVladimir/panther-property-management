import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  useMyNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from '../../api/notifications';
import { Bell, CheckCircle2, Shield, Calendar, DollarSign, Wrench } from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export const ClientNotificationsPage: React.FC = () => {
  const { error: toastError } = useToast();
  const notificationsQuery = useMyNotificationsQuery();
  const notifications = notificationsQuery.data ?? [];
  const markReadMutation = useMarkNotificationReadMutation();
  const markAllReadMutation = useMarkAllNotificationsReadMutation();
  const markNotificationRead = (id: string) =>
    markReadMutation.mutate(id, { onError: () => toastError('Failed', 'Could not mark this notification as read.') });
  const markAllNotificationsRead = () =>
    markAllReadMutation.mutate(undefined, { onError: () => toastError('Failed', 'Could not mark all notifications as read.') });

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Resident Hub
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 dark:text-white mt-1">
            Notifications & Announcements
          </h1>
        </div>

        <button
          onClick={markAllNotificationsRead}
          className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
        >
          Mark all as read
        </button>
      </div>

      <div className="space-y-3">
        {notifications.map((n) => (
          <div
            key={n.id}
            onClick={() => markNotificationRead(n.id)}
            className={`p-5 rounded-2xl border transition-all cursor-pointer ${
              n.read
                ? 'glass-card opacity-80 hover:opacity-100'
                : 'bg-brand-50/60 dark:bg-brand-950/40 border-brand-300 dark:border-brand-800 shadow-soft'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900 dark:text-white">{n.title}</span>
                {!n.read && <span className="w-2 h-2 rounded-full bg-brand-500" />}
              </div>
              <span className="text-xs text-slate-400 font-medium">{n.time}</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              {n.message}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
