import React, { useState } from 'react';
import { usePropertiesQuery } from '../../api/properties';
import {
  useRentalTypesQuery,
  useCreateRentalTypeMutation,
  useUpdateRentalTypeMutation,
  RentalTypeInput,
} from '../../api/rentalTypes';
import { useToast } from '../../context/ToastContext';
import {
  Layers,
  Plus,
  CheckCircle2,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { RentalTypeConfig, FurnishingType } from '../../types';

export const AdminRentalTypesPage: React.FC = () => {
  const { data: rentalTypes = [] } = useRentalTypesQuery();
  const { data: properties = [] } = usePropertiesQuery();
  const createRentalType = useCreateRentalTypeMutation();
  const updateRentalType = useUpdateRentalTypeMutation();
  const { success, error } = useToast();
  const saving = createRentalType.isPending || updateRentalType.isPending;

  const [modalOpen, setModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<RentalTypeConfig | null>(null);

  // Form State
  const [name, setName] = useState<FurnishingType>('Fully Furnished');
  const [description, setDescription] = useState('');
  const [priceMultiplier, setPriceMultiplier] = useState(1.2);
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  const openCreateModal = () => {
    setEditingType(null);
    setName('Semi-Furnished');
    setDescription('Custom furnishing configuration with appliances and master bedroom set.');
    setPriceMultiplier(1.15);
    setStatus('active');
    setModalOpen(true);
  };

  const openEditModal = (rt: RentalTypeConfig) => {
    setEditingType(rt);
    setName(rt.name);
    setDescription(rt.description);
    setPriceMultiplier(rt.priceMultiplier);
    setStatus(rt.status);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingType) {
        const payload: RentalTypeInput = {
          name,
          description,
          priceMultiplier,
          status,
          applicablePropertyIds: editingType.applicablePropertyIds,
          includedMaterials: editingType.includedMaterials.map(({ id: _id, ...rest }) => rest),
        };
        await updateRentalType.mutateAsync({ id: editingType.id, input: payload });
        success('Rental Package Updated', `Saved updates for ${name}.`);
      } else {
        const payload: RentalTypeInput = {
          name,
          description,
          priceMultiplier,
          status,
          // Defaults to every currently-real property — this form has no per-property picker.
          applicablePropertyIds: properties.map((p) => p.id),
          includedMaterials: [
            { name: 'Bed Frame & Orthopedic Mattress', quantity: 1, condition: 'Excellent', category: 'Bedroom' },
            { name: 'Double-Door Refrigerator', quantity: 1, condition: 'Excellent', category: 'Kitchen' },
          ],
        };
        await createRentalType.mutateAsync(payload);
        success('Rental Package Created', `Configured new rental type: ${name}.`);
      }
      setModalOpen(false);
    } catch {
      error('Save Failed', 'Could not save this rental type. Please try again.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Modular Tenancy Schema
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 dark:text-white mt-1">
            Configurable Rental & Furnishing Types
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Define dynamic rental tiers (Fully Furnished, Self Furnished, Executive Suites), price multipliers, and default assigned materials.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Rental Tier</span>
        </button>
      </div>

      {/* Rental Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {rentalTypes.map((rt) => (
          <div
            key={rt.id}
            className="glass-card p-6 sm:p-7 rounded-3xl shadow-soft flex flex-col justify-between space-y-6 border hover:border-purple-500/60 transition-all"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-600">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold font-display text-slate-900 dark:text-white">{rt.name}</h3>
                    <Badge variant={rt.status === 'active' ? 'success' : 'neutral'} size="sm">
                      {rt.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                <span className="text-sm font-extrabold px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-mono">
                  {rt.priceMultiplier}x Base Rate
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {rt.description}
              </p>

              {/* Included Materials Preview */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    Included Asset Package ({rt.includedMaterials.length} items)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {rt.includedMaterials.slice(0, 4).map((m, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="truncate">{m.name} ({m.quantity}x)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Applicable across {rt.applicablePropertyIds.length} propert{rt.applicablePropertyIds.length === 1 ? 'y' : 'ies'}
              </span>
              <button
                onClick={() => openEditModal(rt)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 hover:text-purple-600 text-xs font-bold transition-colors"
              >
                Configure Tier
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Config Modal */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingType ? `Configure ${editingType.name}` : 'Create Rental Tier'}
        >
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Tier Package Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value as FurnishingType)}
                placeholder="e.g. Executive Luxury Suite"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Description *
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detail what furniture, electronics and services are included..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white text-xs placeholder:text-slate-400 resize-none focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">
                  Price Multiplier Formula *
                </label>
                <input
                  type="number"
                  step="0.05"
                  required
                  value={priceMultiplier}
                  onChange={(e) => setPriceMultiplier(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md transition-all disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save Rental Type Configuration'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
