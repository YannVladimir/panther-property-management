import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { useMyClientQuery } from '../../api/clients';
import { useCreateMaintenanceIssueMutation } from '../../api/maintenanceIssues';
import {
  Package,
  ShieldCheck,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Plus,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ClientMaterial } from '../../types';

export const MyMaterialsPage: React.FC = () => {
  const { data: client, isLoading } = useMyClientQuery();
  const createIssueMutation = useCreateMaintenanceIssueMutation();
  const { success, error } = useToast();

  const [selectedMaterial, setSelectedMaterial] = useState<ClientMaterial | null>(null);
  const [issueDescription, setIssueDescription] = useState('');

  const isSubmitting = createIssueMutation.isPending;

  const handleReportMaterialIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterial || !client) return;

    try {
      await createIssueMutation.mutateAsync({
        propertyId: client.currentPropertyId,
        roomId: client.currentRoomId,
        category: 'Furniture',
        title: `Service Request: ${selectedMaterial.name}`,
        description: issueDescription || `Reported condition check for ${selectedMaterial.name} (SN: ${selectedMaterial.serialNumber})`,
        priority: 'Medium',
        photos: [],
      });

      setSelectedMaterial(null);
      setIssueDescription('');
      success('Ticket Logged', `Service request filed for ${selectedMaterial.name}.`);
    } catch {
      error('Submission Failed', 'Could not log this service request. Please try again.');
    }
  };

  if (isLoading || !client) {
    return <div className="py-24 text-center text-sm text-slate-400">Loading your materials…</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Assigned Property Assets
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 dark:text-white mt-1">
            My Materials & Furniture
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Verified inventory assigned to Unit {client.currentRoomNumber} ({client.rentalType})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="purple" size="md">
            <Package className="w-3.5 h-3.5" />
            {client.materials.length} Tracked Assets
          </Badge>
        </div>
      </div>

      {/* Materials Table */}
      <div className="glass-card rounded-3xl shadow-soft overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
            Handover Asset Registry
          </h3>
          <span className="text-xs text-slate-400">Signed during move-in check-in</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold text-[10px] bg-slate-50/50 dark:bg-slate-800/30">
                <th className="py-3.5 px-6">Item Name</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Quantity</th>
                <th className="py-3.5 px-4">Serial / Tag</th>
                <th className="py-3.5 px-4">Assigned Date</th>
                <th className="py-3.5 px-4">Condition</th>
                <th className="py-3.5 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {client.materials.map((mat) => (
                <tr key={mat.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                    {mat.name}
                  </td>
                  <td className="py-4 px-4 text-slate-500">{mat.category}</td>
                  <td className="py-4 px-4 font-semibold">{mat.quantity}x</td>
                  <td className="py-4 px-4 font-mono text-[11px] text-brand-600 dark:text-brand-400">
                    {mat.serialNumber}
                  </td>
                  <td className="py-4 px-4 text-slate-500">{mat.assignedDate}</td>
                  <td className="py-4 px-4">
                    <Badge
                      variant={
                        mat.condition === 'Excellent' || mat.condition === 'Good'
                          ? 'success'
                          : 'warning'
                      }
                      size="sm"
                    >
                      {mat.condition}
                    </Badge>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => setSelectedMaterial(mat)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Request Check</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Material Service Modal */}
      {selectedMaterial && (
        <Modal
          isOpen={Boolean(selectedMaterial)}
          onClose={() => setSelectedMaterial(null)}
          title={`Report Issue with ${selectedMaterial.name}`}
          subtitle={`Tag: ${selectedMaterial.serialNumber}`}
        >
          <form onSubmit={handleReportMaterialIssue} className="space-y-4">
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Describe the problem or required repair *
              </label>
              <textarea
                rows={3}
                required
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                placeholder="e.g. Joint seems loose, surface scratch, needs replacement..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white text-xs placeholder:text-slate-400 resize-none focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md transition-all"
              >
                {isSubmitting ? 'Submitting...' : 'Dispatch Maintenance Request'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
