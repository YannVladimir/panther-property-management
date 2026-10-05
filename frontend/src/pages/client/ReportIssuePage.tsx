import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { useMyClientQuery } from '../../api/clients';
import { useMyMaintenanceIssuesQuery, useCreateMaintenanceIssueMutation } from '../../api/maintenanceIssues';
import {
  Wrench,
  AlertTriangle,
  Upload,
  CheckCircle2,
  Clock,
  User,
  Shield,
  FileText,
  Plus,
  Image,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { FileUploadButton } from '../../components/common/FileUploadButton';
import { MaintenanceIssue, IssuePriority } from '../../types';

export const ReportIssuePage: React.FC = () => {
  const { data: client, isLoading: clientLoading } = useMyClientQuery();
  const issuesQuery = useMyMaintenanceIssuesQuery();
  const createIssueMutation = useCreateMaintenanceIssueMutation();
  const { success, error } = useToast();

  const clientIssues = issuesQuery.data ?? [];

  // Form State
  const [category, setCategory] = useState<MaintenanceIssue['category']>('Plumbing');
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<IssuePriority>('Medium');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  const isSubmitting = createIssueMutation.isPending;

  const handleSubmitIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;
    if (!title || !description) {
      error('Incomplete form', 'Please provide a title and detailed description.');
      return;
    }

    try {
      const newIssue = await createIssueMutation.mutateAsync({
        propertyId: client.currentPropertyId,
        roomId: client.currentRoomId,
        category,
        title,
        description,
        priority,
        photos: photoUrl ? [photoUrl] : [],
      });

      setTitle('');
      setDescription('');
      setPhotoUrl('');
      success('Issue Reported', `Ticket ${newIssue.ticketNumber} logged. Operations team notified.`);
    } catch {
      error('Submission Failed', 'Could not log this issue. Please try again.');
    }
  };

  if (clientLoading || issuesQuery.isLoading || !client) {
    return <div className="py-24 text-center text-sm text-slate-400">Loading your profile…</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200 dark:border-slate-800">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
          Resident Maintenance Desk
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 dark:text-white mt-1">
          Report an Issue & Track Tickets
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Submit plumbing, electrical, HVAC, or furniture service requests for Unit {client.currentRoomNumber}.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 1 Col: Report Form */}
        <div className="glass-card p-6 sm:p-7 rounded-3xl shadow-soft space-y-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600">
              <Wrench className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold font-display text-slate-900 dark:text-white">
              New Service Ticket
            </h2>
          </div>

          <form onSubmit={handleSubmitIssue} className="space-y-4">
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Issue Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              >
                <option value="Plumbing">Plumbing & Water Flow</option>
                <option value="Electrical">Electrical & Lighting</option>
                <option value="HVAC">Air Conditioning & Climate</option>
                <option value="Furniture">Furniture & Woodwork</option>
                <option value="Appliances">Kitchen / Laundry Appliances</option>
                <option value="Structural">Doors, Windows & Walls</option>
                <option value="Other">Other Maintenance</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Priority Level *
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              >
                <option value="Low">Low — Routine maintenance</option>
                <option value="Medium">Medium — Standard attention needed</option>
                <option value="High">High — Urgent attention requested</option>
                <option value="Emergency">Emergency — Immediate risk (leak, power outage)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Ticket Title / Summary *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Master bathroom tap dripping constantly"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Detailed Description *
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please describe when it started, location in the apartment, and any observations..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white text-xs placeholder:text-slate-400 resize-none focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Photo Attachment (Optional)
              </label>
              <div className="flex items-center gap-2">
                <FileUploadButton
                  folder="maintenance-issue-photos"
                  accept="image/*"
                  label={photoUrl ? 'Replace Photo' : 'Attach Photo'}
                  onUploaded={(result) => setPhotoUrl(result.url)}
                />
                {photoUrl && (
                  <img src={photoUrl} alt="Attached" className="w-10 h-10 rounded-lg object-cover border" />
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md transition-all"
            >
              {isSubmitting ? 'Logging Ticket...' : 'Submit Issue to Operations'}
            </button>
          </form>
        </div>

        {/* Right 2 Cols: Ticket History & Lifecycle Tracker */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-display text-slate-900 dark:text-white">
              Reported Tickets ({clientIssues.length})
            </h2>
            <span className="text-xs text-slate-400">Real-time status updates</span>
          </div>

          <div className="space-y-4">
            {clientIssues.map((issue) => (
              <div
                key={issue.id}
                className="glass-card p-6 rounded-3xl shadow-soft space-y-4 border"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-slate-400">{issue.ticketNumber}</span>
                      <Badge variant="purple" size="sm">{issue.category}</Badge>
                      <Badge
                        variant={
                          issue.priority === 'Emergency'
                            ? 'danger'
                            : issue.priority === 'High'
                            ? 'warning'
                            : 'info'
                        }
                        size="sm"
                      >
                        {issue.priority}
                      </Badge>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {issue.title}
                    </h3>
                  </div>

                  <Badge
                    variant={
                      issue.status === 'Resolved' || issue.status === 'Closed'
                        ? 'success'
                        : issue.status === 'In Progress'
                        ? 'warning'
                        : 'info'
                    }
                    size="md"
                    dot
                  >
                    {issue.status}
                  </Badge>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {issue.description}
                </p>

                {issue.photos.length > 0 && (
                  <div className="flex gap-2 pt-1">
                    {issue.photos.map((p, i) => (
                      <img key={i} src={p} alt="Evidence" className="w-16 h-16 rounded-xl object-cover border" />
                    ))}
                  </div>
                )}

                {/* Assigned Contractor Info */}
                {issue.assignedTechnicianName && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border text-xs flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Assigned Contractor</span>
                      <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                        {issue.assignedTechnicianName} ({issue.technicianSpecialty})
                      </p>
                    </div>
                    <span className="text-xs text-emerald-600 font-semibold">Active Work Order</span>
                  </div>
                )}

                {/* Resolution notes if resolved */}
                {issue.resolutionNotes && (
                  <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Resolution Note ({issue.resolutionDate}):
                    </p>
                    <p className="text-[11px] leading-relaxed">{issue.resolutionNotes}</p>
                  </div>
                )}

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>Reported on: {issue.reportedDate}</span>
                  <span>Unit {issue.roomNumber} ({issue.propertyName})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
