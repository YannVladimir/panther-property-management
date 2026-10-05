import React, { useState, useMemo, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import {
  useDamageReportsQuery,
  useCreateDamageReportMutation,
  useUpdateDamageReportMutation,
  useUpdateDamageStatusMutation,
  DamageReportInput,
} from '../../api/damageReports';
import { usePropertiesQuery } from '../../api/properties';
import { useClientsQuery } from '../../api/clients';
import { useRoomsQuery } from '../../api/rooms';
import { useUploadFileMutation } from '../../api/files';
import {
  AlertTriangle,
  Search,
  Plus,
  DollarSign,
  User,
  Building,
  CheckCircle2,
  Clock,
  Camera,
  FileText,
  Edit,
  Trash2,
  Upload,
  X,
  Eye,
  Check,
  ShieldAlert,
  HelpCircle,
  Image as ImageIcon,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Pagination } from '../../components/common/Pagination';
import { Modal } from '../../components/common/Modal';
import { DamageReport } from '../../types';

export const DamagesManagementPage: React.FC = () => {
  const damagesQuery = useDamageReportsQuery();
  const propertiesQuery = usePropertiesQuery();
  const clientsQuery = useClientsQuery();
  const createDamageMutation = useCreateDamageReportMutation();
  const updateDamageMutation = useUpdateDamageReportMutation();
  const updateDamageStatusMutation = useUpdateDamageStatusMutation();
  const uploadFileMutation = useUploadFileMutation();
  const { success, info, error } = useToast();

  const damages = damagesQuery.data ?? [];
  const properties = propertiesQuery.data ?? [];
  const clients = clientsQuery.data ?? [];
  const isLoading = damagesQuery.isLoading || propertiesQuery.isLoading || clientsQuery.isLoading;

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending Review' | 'In Repair' | 'Resolved'>('all');
  const [liabilityFilter, setLiabilityFilter] = useState<'all' | 'Tenant' | 'Property Owner' | 'Wear & Tear' | 'Contractor'>('all');
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Side Panel (Drawer) State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingDamageId, setEditingDamageId] = useState<string | null>(null);

  // Form State
  const [propertyId, setPropertyId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [clientId, setClientId] = useState('');
  const [item, setItem] = useState('');
  const [damageType, setDamageType] = useState('Scratch / Dent');
  const [description, setDescription] = useState('');
  const [estimatedCost, setEstimatedCost] = useState<number>(120);
  const [amountCharged, setAmountCharged] = useState<number>(120);
  const [responsibleParty, setResponsibleParty] = useState<DamageReport['responsibleParty']>('Tenant');
  const [status, setStatus] = useState<DamageReport['status']>('Pending Review');
  const [photos, setPhotos] = useState<string[]>([]);

  const roomsQuery = useRoomsQuery({ propertyId: propertyId || undefined });
  const rooms = roomsQuery.data ?? [];

  useEffect(() => {
    if (!propertyId && properties.length > 0) setPropertyId(properties[0].id);
  }, [properties, propertyId]);

  useEffect(() => {
    // Clear the selected room whenever it's no longer valid for the currently-selected property.
    if (roomId && !rooms.some((r) => r.id === roomId)) setRoomId('');
  }, [rooms, roomId]);

  // Resolve Confirmation Modal State
  const [confirmResolveDamage, setConfirmResolveDamage] = useState<DamageReport | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('Repairs completed and settled with resident.');

  // Photo Preview Modal
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  const totalDamagesCost = damages.reduce((acc, d) => acc + d.estimatedCost, 0);
  const totalCharged = damages.reduce((acc, d) => acc + d.amountCharged, 0);
  const resolvedCount = damages.filter((d) => d.status === 'Resolved').length;
  const pendingCount = damages.filter((d) => d.status === 'Pending Review' || d.status === 'In Repair').length;

  const filteredDamages = useMemo(() => damages.filter((d) => {
    if (statusFilter !== 'all' && d.status !== statusFilter) return false;
    if (liabilityFilter !== 'all' && d.responsibleParty !== liabilityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        d.item.toLowerCase().includes(q) ||
        d.propertyName.toLowerCase().includes(q) ||
        d.roomNumber.toLowerCase().includes(q) ||
        (d.clientName && d.clientName.toLowerCase().includes(q))
      );
    }
    return true;
  }), [damages, statusFilter, liabilityFilter, searchQuery]);

  const pagedDamages = useMemo(() => {
    const start = (pageIndex - 1) * pageSize;
    return filteredDamages.slice(start, start + pageSize);
  }, [filteredDamages, pageIndex, pageSize]);

  // Open drawer to create new damage
  const handleOpenCreateDrawer = () => {
    setIsEditing(false);
    setEditingDamageId(null);
    setPropertyId(properties[0]?.id ?? '');
    setRoomId('');
    setClientId('');
    setItem('');
    setDamageType('Scratch / Dent');
    setDescription('');
    setEstimatedCost(120);
    setAmountCharged(120);
    setResponsibleParty('Tenant');
    setStatus('Pending Review');
    setPhotos([]);
    setDrawerOpen(true);
  };

  // Open drawer to edit existing damage (room can't be changed after creation — the real API has
  // no roomId field on the update request, only on create)
  const handleOpenEditDrawer = (damage: DamageReport) => {
    setIsEditing(true);
    setEditingDamageId(damage.id);
    setPropertyId(damage.propertyId);
    setRoomId(damage.roomId);
    setClientId(damage.clientId ?? '');
    setItem(damage.item);
    setDamageType(damage.damageType);
    setDescription(damage.description || '');
    setEstimatedCost(damage.estimatedCost);
    setAmountCharged(damage.amountCharged);
    setResponsibleParty(damage.responsibleParty);
    setStatus(damage.status);
    setPhotos(damage.photos || []);
    setDrawerOpen(true);
  };

  // Save damage (Create or Edit)
  const handleSaveDamage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditing && !roomId) {
      error('Validation Error', 'Please select a unit for this damage report.');
      return;
    }

    const input: DamageReportInput = {
      propertyId,
      roomId,
      clientId: clientId || undefined,
      item,
      damageType,
      description,
      reportedDate: isEditing ? damages.find((d) => d.id === editingDamageId)?.reportedDate ?? new Date().toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      photos,
      estimatedCost: Number(estimatedCost),
      amountCharged: Number(amountCharged),
      responsibleParty,
    };

    try {
      if (isEditing && editingDamageId) {
        await updateDamageMutation.mutateAsync({ id: editingDamageId, input });
        // The real update endpoint has no status field (status changes go through a dedicated
        // endpoint) — fire it separately whenever this form's status dropdown actually changed,
        // so an edit that also changes status doesn't silently drop that part of the save.
        const original = damages.find((d) => d.id === editingDamageId);
        if (original && original.status !== status) {
          await updateDamageStatusMutation.mutateAsync({ id: editingDamageId, status });
        }
        success('Incident Updated', `Updated record for ${item}.`);
      } else {
        const newDmg = await createDamageMutation.mutateAsync(input);
        success('Damage Logged', `Recorded incident for ${newDmg.item} in Unit ${newDmg.roomNumber}.`);
      }
      setDrawerOpen(false);
    } catch {
      error('Save Failed', 'Could not save this damage report. Please try again.');
    }
  };

  // Handle Photo File Upload — real upload to POST /api/v1/files (previously a FileReader-only
  // local preview that was never actually persisted anywhere).
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      try {
        const result = await uploadFileMutation.mutateAsync({ file, folder: 'damage-photos' });
        setPhotos((prev) => [...prev, result.url]);
      } catch {
        error('Upload Failed', `Could not upload ${file.name}.`);
      }
    }

    e.target.value = '';
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Resolve Confirmation Handler
  const handleConfirmResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmResolveDamage) return;

    try {
      await updateDamageStatusMutation.mutateAsync({
        id: confirmResolveDamage.id,
        status: 'Resolved',
        resolutionNotes,
      });
      success(
        'Incident Resolved',
        `Marked "${confirmResolveDamage.item}" in Unit ${confirmResolveDamage.roomNumber} as Resolved.`
      );
      setConfirmResolveDamage(null);
    } catch {
      error('Update Failed', 'Could not mark this incident resolved. Please try again.');
    }
  };

  if (isLoading) {
    return <div className="py-24 text-center text-sm text-slate-400">Loading damage reports…</div>;
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 text-xs font-bold mb-1 border border-amber-200 dark:border-amber-800/60">
            <ShieldAlert className="w-3.5 h-3.5" />
            Property Assets & Liability Management
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 dark:text-white">
            Damage & Incident Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Log unit damages, assign liability, manage photo evidence, calculate repair costs, and track resolution settlements.
          </p>
        </div>

        <button
          onClick={handleOpenCreateDrawer}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md hover:shadow-glow transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Record Damage Incident</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-2xl border shadow-soft space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Valuation</span>
          <p className="text-2xl font-extrabold font-display text-slate-900 dark:text-white">
            ${totalDamagesCost}
          </p>
          <p className="text-[11px] text-slate-500">{damages.length} Total Incidents</p>
        </div>

        <div className="glass-card p-4 rounded-2xl border shadow-soft space-y-1 bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900">
          <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Recovered / Charged</span>
          <p className="text-2xl font-extrabold font-display text-emerald-600 dark:text-emerald-400">
            ${totalCharged}
          </p>
          <p className="text-[11px] text-emerald-600 font-semibold">Tenant billed invoices</p>
        </div>

        <div className="glass-card p-4 rounded-2xl border shadow-soft space-y-1 bg-sky-50/40 dark:bg-sky-950/20 border-sky-200 dark:border-sky-900">
          <span className="text-[10px] uppercase font-bold text-sky-600 dark:text-sky-400">Wear & Tear Absorbed</span>
          <p className="text-2xl font-extrabold font-display text-sky-600 dark:text-sky-400">
            ${Math.max(0, totalDamagesCost - totalCharged)}
          </p>
          <p className="text-[11px] text-slate-400">Building maintenance reserve</p>
        </div>

        <div className="glass-card p-4 rounded-2xl border shadow-soft space-y-1 bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
          <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">Pending / In Repair</span>
          <p className="text-2xl font-extrabold font-display text-amber-600 dark:text-amber-400">
            {pendingCount} Active
          </p>
          <p className="text-[11px] text-amber-600 font-semibold">{resolvedCount} Settled & Closed</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 rounded-2xl shadow-soft flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search damages by item name, estate, unit #, or tenant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
          >
            <option value="all">All Statuses ({damages.length})</option>
            <option value="Pending Review">Pending Review</option>
            <option value="In Repair">In Repair</option>
            <option value="Resolved">Resolved</option>
          </select>

          <select
            value={liabilityFilter}
            onChange={(e) => setLiabilityFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
          >
            <option value="all">All Liabilities</option>
            <option value="Tenant">Tenant</option>
            <option value="Property Owner">Property Owner</option>
            <option value="Wear & Tear">Wear & Tear</option>
            <option value="Contractor">Contractor</option>
          </select>
        </div>
      </div>

      {/* Damages Table */}
      <div className="glass-card rounded-3xl shadow-soft overflow-hidden border">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold text-[10px] bg-slate-50/50 dark:bg-slate-800/30">
                <th className="py-3.5 px-6">Incident / Item</th>
                <th className="py-3.5 px-4">Estate & Unit</th>
                <th className="py-3.5 px-4">Responsible Party</th>
                <th className="py-3.5 px-4">Reported Date</th>
                <th className="py-3.5 px-4">Repair Cost</th>
                <th className="py-3.5 px-4">Charged</th>
                <th className="py-3.5 px-4">Photos</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredDamages.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    No damage incident records match your filters.
                  </td>
                </tr>
              ) : (
                pagedDamages.map((dmg) => (
                  <tr key={dmg.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-900 dark:text-white text-xs">{dmg.item}</p>
                      <p className="text-[11px] text-slate-500">{dmg.damageType}</p>
                      {dmg.description && (
                        <p className="text-[10px] text-slate-400 line-clamp-1 italic mt-0.5 max-w-xs">
                          &ldquo;{dmg.description}&rdquo;
                        </p>
                      )}
                    </td>
                    <td className="py-4 px-4 font-medium">
                      <p className="font-bold text-brand-600 dark:text-brand-400 font-mono">
                        Unit {dmg.roomNumber}
                      </p>
                      <p className="text-[10px] text-slate-500">{dmg.propertyName}</p>
                      {dmg.clientName && (
                        <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>{dmg.clientName}</span>
                        </p>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <Badge
                        variant={
                          dmg.responsibleParty === 'Tenant'
                            ? 'danger'
                            : dmg.responsibleParty === 'Property Owner'
                            ? 'warning'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {dmg.responsibleParty}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-slate-500 font-mono text-[11px]">{dmg.reportedDate}</td>
                    <td className="py-4 px-4 font-bold text-slate-900 dark:text-white font-mono">
                      ${dmg.estimatedCost}
                    </td>
                    <td className="py-4 px-4 font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                      ${dmg.amountCharged}
                    </td>
                    <td className="py-4 px-4">
                      {dmg.photos && dmg.photos.length > 0 ? (
                        <div className="flex items-center gap-1">
                          {dmg.photos.slice(0, 2).map((photo, idx) => (
                            <img
                              key={idx}
                              src={photo}
                              alt="Damage thumbnail"
                              onClick={() => setPreviewPhotoUrl(photo)}
                              className="w-7 h-7 rounded-lg object-cover border border-slate-200 dark:border-slate-700 cursor-pointer hover:scale-110 transition-transform shadow-2xs"
                            />
                          ))}
                          {dmg.photos.length > 2 && (
                            <span
                              onClick={() => setPreviewPhotoUrl(dmg.photos[0])}
                              className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300 flex items-center justify-center cursor-pointer hover:bg-slate-200"
                            >
                              +{dmg.photos.length - 2}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400">None</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <Badge
                        variant={
                          dmg.status === 'Resolved'
                            ? 'success'
                            : dmg.status === 'In Repair'
                            ? 'warning'
                            : 'danger'
                        }
                        size="sm"
                        dot
                      >
                        {dmg.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEditDrawer(dmg)}
                          title="Edit incident details"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {/* Resolve Button with Confirmation */}
                        {dmg.status !== 'Resolved' ? (
                          <button
                            onClick={() => {
                              setConfirmResolveDamage(dmg);
                              setResolutionNotes('Repairs completed and settled with resident.');
                            }}
                            className="px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-800 transition-colors inline-flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Resolve</span>
                          </button>
                        ) : (
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px]">
                            Settled ✓
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={pageIndex}
          totalItems={filteredDamages.length}
          pageSize={pageSize}
          onPageChange={(p) => setPageIndex(p)}
          onPageSizeChange={(s) => { setPageSize(s); setPageIndex(1); }}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 1. SLIDE-IN SIDE PANEL: RECORD / EDIT DAMAGE INCIDENT        */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div
        className={`fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300 ${
          drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setDrawerOpen(false)}
      />

      <aside
        className={`fixed right-0 top-0 h-full z-50 w-full max-w-xl bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold text-[10px] mb-1">
              <AlertTriangle className="w-3 h-3 text-amber-500" />
              <span>{isEditing ? 'Edit Incident Record' : 'New Damage Filing'}</span>
            </div>
            <h2 className="text-lg font-extrabold font-display text-slate-900 dark:text-white">
              {isEditing ? `Edit: ${item || 'Damage Incident'}` : 'Record Damage Incident'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Log damaged assets, assign liability, upload multiple photo evidence, and compute costs.
            </p>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Form Body */}
        <form onSubmit={handleSaveDamage} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-700 dark:text-slate-300">
          {/* Estate & Unit Information */}
          <div className="space-y-3">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Estate & Location Details *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">
                  Property Estate *
                </label>
                <select
                  value={propertyId}
                  disabled={isEditing}
                  onChange={(e) => setPropertyId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all disabled:opacity-60"
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">
                  Unit / Suite *
                </label>
                <select
                  required
                  value={roomId}
                  disabled={isEditing}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all disabled:opacity-60"
                >
                  <option value="">-- Select Unit --</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>Unit {r.roomNumber}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Resident / Occupant
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              >
                <option value="">-- No resident on file --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Damaged Item & Classification */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Damage Specifics & Classification *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">
                  Damaged Item / Asset *
                </label>
                <input
                  type="text"
                  required
                  value={item}
                  onChange={(e) => setItem(e.target.value)}
                  placeholder="e.g. Hardwood Dining Table Glass Top"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">
                  Damage Classification *
                </label>
                <input
                  type="text"
                  required
                  value={damageType}
                  onChange={(e) => setDamageType(e.target.value)}
                  placeholder="e.g. Deep scratch, Shattered, Water burn"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Cost & Liability */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Financial Assessment & Liability *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">
                  Estimated Cost ($) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={estimatedCost}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setEstimatedCost(val);
                    if (responsibleParty === 'Tenant') setAmountCharged(val);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-extrabold font-mono text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">
                  Tenant Charged ($) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={amountCharged}
                  onChange={(e) => setAmountCharged(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 font-extrabold font-mono text-emerald-600 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">
                  Responsible Party *
                </label>
                <select
                  value={responsibleParty}
                  onChange={(e) => {
                    const party = e.target.value as DamageReport['responsibleParty'];
                    setResponsibleParty(party);
                    if (party === 'Tenant') setAmountCharged(estimatedCost);
                    else setAmountCharged(0);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                >
                  <option value="Tenant">Tenant Liability</option>
                  <option value="Property Owner">Property Owner</option>
                  <option value="Wear & Tear">Normal Wear & Tear</option>
                  <option value="Contractor">Contractor Fault</option>
                </select>
              </div>
            </div>
          </div>

          {/* Status & Circumstances */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Incident Status & Description
            </label>
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Current Incident Status *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as DamageReport['status'])}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              >
                <option value="Pending Review">Pending Review</option>
                <option value="In Repair">In Repair</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Description & Circumstances
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detail what caused the damage, parts required for repair, technician assessment..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white text-xs placeholder:text-slate-400 resize-none focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Multiple Photo Upload Component */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Damage Photos ({photos.length})
              </label>
              <span className="text-[10px] text-slate-400 font-bold">JPG, PNG, WebP supported</span>
            </div>

            {/* Photo Preview Grid */}
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2.5 mb-3">
                {photos.map((p, idx) => (
                  <div
                    key={idx}
                    className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 group h-24 bg-slate-100 dark:bg-slate-800"
                  >
                    <img
                      src={p}
                      alt={`Damage photo ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                      <button
                        type="button"
                        onClick={() => setPreviewPhotoUrl(p)}
                        title="View photo full size"
                        className="p-1.5 rounded-lg bg-white/90 text-slate-900 hover:bg-white transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
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

            {/* Upload Box */}
            <label className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-amber-500 hover:bg-amber-50/40 dark:hover:bg-amber-950/20 transition-all cursor-pointer text-center group">
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform mb-1">
                <Upload className="w-4 h-4" />
              </div>
              <span className="font-bold text-xs text-slate-700 dark:text-slate-200">
                Click or Drag to Upload Damage Photos
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">
                Add multiple pictures taken on-site
              </span>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </div>

          {/* Drawer Footer Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="px-4 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{isEditing ? 'Save Changes' : 'Record Damage Incident'}</span>
            </button>
          </div>
        </form>
      </aside>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 2. CONFIRM RESOLUTION MODAL                                 */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {confirmResolveDamage && (
        <Modal
          isOpen={Boolean(confirmResolveDamage)}
          onClose={() => setConfirmResolveDamage(null)}
          title="Confirm Damage Incident Resolution"
          subtitle={`Are you sure you want to mark this incident as Resolved?`}
        >
          <form onSubmit={handleConfirmResolve} className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Incident Item:</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{confirmResolveDamage.item}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Location:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {confirmResolveDamage.propertyName} • Unit {confirmResolveDamage.roomNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Repair Cost:</span>
                <span className="font-extrabold font-mono text-slate-900 dark:text-white">${confirmResolveDamage.estimatedCost}</span>
              </div>
              <div className="flex justify-between border-t border-emerald-200 dark:border-emerald-800 pt-1.5">
                <span className="text-slate-500 font-semibold">Tenant Charged:</span>
                <span className="font-extrabold font-mono text-emerald-600 text-sm">${confirmResolveDamage.amountCharged}</span>
              </div>
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">
                Resolution Remarks & Settlement Notes *
              </label>
              <textarea
                rows={3}
                required
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Enter details on how repairs were carried out, technician dispatch, or tenant deduction settlement..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border font-medium resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmResolveDamage(null)}
                className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Mark as Resolved</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 3. PHOTO PREVIEW MODAL                                      */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {previewPhotoUrl && (
        <Modal
          isOpen={Boolean(previewPhotoUrl)}
          onClose={() => setPreviewPhotoUrl(null)}
          title="Damage Photo Evidence"
          subtitle="On-site inspection photographic evidence"
          maxWidth="2xl"
        >
          <div className="space-y-4">
            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 flex items-center justify-center max-h-[500px]">
              <img
                src={previewPhotoUrl}
                alt="Full size damage evidence"
                className="w-full h-auto max-h-[500px] object-contain"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setPreviewPhotoUrl(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              >
                Close Preview
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
