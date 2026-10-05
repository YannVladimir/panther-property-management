import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { ApiError, resolveFileUrl } from '../../api/client';
import {
  useClientQuery,
  useUpdateClientMutation,
  useUpdateClientStatusMutation,
  useAddClientDocumentMutation,
  useDeleteClientDocumentMutation,
  useAddClientMaterialMutation,
  useDeleteClientMaterialMutation,
  useUpdateClientMaterialConditionMutation,
} from '../../api/clients';
import { useDamageReportsQuery, useCreateDamageReportMutation, useUpdateDamageStatusMutation, DamageReportInput } from '../../api/damageReports';
import { usePaymentsQuery, useCreatePaymentMutation, PaymentInput } from '../../api/payments';
import { useMaintenanceIssuesQuery } from '../../api/maintenanceIssues';
import { useWaterMetersQuery, useUpdateWaterMeterReadingMutation } from '../../api/waterMeters';
import { useUploadFileMutation } from '../../api/files';
import {
  User,
  ArrowLeft,
  Phone,
  Mail,
  Building,
  DoorOpen,
  Calendar,
  DollarSign,
  FileText,
  Upload,
  AlertTriangle,
  Package,
  Wrench,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Eye,
  Download,
  Edit3,
  ExternalLink,
  Save,
  Clock,
  Sparkles,
  Layers,
  FileCheck,
  Droplets,
  TrendingUp,
  TrendingDown,
  Hash,
  UserX,
  UserCheck,
  Ban,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Pagination } from '../../components/common/Pagination';
import { Modal } from '../../components/common/Modal';
import { FileUploadButton } from '../../components/common/FileUploadButton';
import {
  Client,
  ClientDocument,
  ClientMaterial,
  DamageReport,
  Payment,
  MaintenanceIssue,
} from '../../types';

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];

function getPreviewKind(url: string): 'image' | 'pdf' | 'other' {
  const ext = url.split(/[?#]/)[0].split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'pdf') return 'pdf';
  if (IMAGE_EXTENSIONS.includes(ext)) return 'image';
  return 'other';
}

export const ClientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const clientQuery = useClientQuery(id);
  const client = clientQuery.data;
  const updateClientMutation = useUpdateClientMutation();
  const updateClientStatusMutation = useUpdateClientStatusMutation();
  const addClientDocumentMutation = useAddClientDocumentMutation();
  const deleteClientDocumentMutation = useDeleteClientDocumentMutation();
  const addClientMaterialMutation = useAddClientMaterialMutation();
  const deleteClientMaterialMutation = useDeleteClientMaterialMutation();
  const updateClientMaterialConditionMutation = useUpdateClientMaterialConditionMutation();
  // Damages, payments, maintenance issues, and water meters are all real, already-converted
  // domains — this page just hadn't been switched over to any of them yet, which is why
  // recording any of them from here never actually persisted.
  const damageReportsQuery = useDamageReportsQuery({ clientId: client?.id });
  const createDamageMutation = useCreateDamageReportMutation();
  const updateDamageStatusMutation = useUpdateDamageStatusMutation();
  const paymentsQuery = usePaymentsQuery({ clientId: client?.id });
  const createPaymentMutation = useCreatePaymentMutation();
  const maintenanceIssuesQuery = useMaintenanceIssuesQuery({ clientId: client?.id });
  // No clientId filter exists on GET /water-meters (it's a small, effectively 1-per-resident
  // dataset) — fetch the full list and find this client's meter, same as WaterMetersPage does.
  const waterMetersQuery = useWaterMetersQuery();
  const updateWaterMeterReadingMutation = useUpdateWaterMeterReadingMutation();
  const uploadFileMutation = useUploadFileMutation();

  const { success, error, info } = useToast();

  // Status Change Modal State
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<Client['status']>('former');
  const [statusReason, setStatusReason] = useState('Lease Agreement Expired / Checked Out');

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    'overview' | 'documents' | 'damages' | 'materials' | 'payments' | 'maintenance' | 'water' | 'edit'
  >('overview');

  // Water meter state
  const [newReading, setNewReading] = useState<number>(0);

  // Modals state
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [damageModalOpen, setDamageModalOpen] = useState(false);
  const [materialModalOpen, setMaterialModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<ClientDocument | null>(null);

  // Document Form State
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState<ClientDocument['type']>('Tenancy Contract');
  const [docFileUrl, setDocFileUrl] = useState('');
  const [docFileSize, setDocFileSize] = useState('');
  const [docStatus, setDocStatus] = useState<ClientDocument['status']>('Verified');

  // Damage Form State
  const [damageItem, setDamageItem] = useState('');
  const [damageType, setDamageType] = useState('Scratch / Dent');
  const [damageDesc, setDamageDesc] = useState('');
  const [damageCost, setDamageCost] = useState(120);
  const [damageCharged, setDamageCharged] = useState(120);
  const [damageResponsible, setDamageResponsible] = useState<DamageReport['responsibleParty']>('Tenant');
  const [damageStatus, setDamageStatus] = useState<DamageReport['status']>('Pending Review');
  const [damagePhotos, setDamagePhotos] = useState<string[]>([]);

  // Material Form State
  const [matName, setMatName] = useState('');
  const [matCategory, setMatCategory] = useState('Living Room');
  const [matQuantity, setMatQuantity] = useState(1);
  const [matCondition, setMatCondition] = useState<ClientMaterial['condition']>('Excellent');
  const [matSerial, setMatSerial] = useState(`MAT-${Math.floor(1000 + Math.random() * 9000)}`);

  // Payment Form State
  const [payAmount, setPayAmount] = useState(client?.monthlyRent || 850);
  const [payType, setPayType] = useState<Payment['type']>('rent');
  const [payMethod, setPayMethod] = useState<Payment['method']>('Mobile Money');
  const [payRef, setPayRef] = useState(`MOMO-${Math.floor(100000 + Math.random() * 900000)}`);

  // Profile Edit State
  const [editName, setEditName] = useState(client?.name || '');
  const [editEmail, setEditEmail] = useState(client?.email || '');
  const [editPhone, setEditPhone] = useState(client?.phone || '');
  const [editAvatarUrl, setEditAvatarUrl] = useState(client?.avatar || '');
  const [editNationality, setEditNationality] = useState(client?.nationality || 'Rwandan');
  const [editIdNum, setEditIdNum] = useState(client?.identificationNumber || '');
  const [editOccupation, setEditOccupation] = useState(client?.occupation || 'Diplomatic Attaché');
  const [editEmployer, setEditEmployer] = useState(client?.employer || 'EU Delegation / Private');
  const [editEmName, setEditEmName] = useState(client?.emergencyContact?.name || '');
  const [editEmPhone, setEditEmPhone] = useState(client?.emergencyContact?.phone || '');
  const [editEmRel, setEditEmRel] = useState(client?.emergencyContact?.relationship || 'Spouse');
  const [editNotes, setEditNotes] = useState(client?.notes || '');

  // Pagination states
  const [payPageIndex, setPayPageIndex] = useState(1);
  const [payPageSize, setPayPageSize] = useState(10);
  const [matPageIndex, setMatPageIndex] = useState(1);
  const [matPageSize, setMatPageSize] = useState(10);

  // Client loads asynchronously now (was a synchronous mock array lookup before) — sync the
  // edit-form/payment-form local state once the real data arrives, not just at initial mount.
  useEffect(() => {
    if (!client) return;
    setEditName(client.name);
    setEditEmail(client.email);
    setEditPhone(client.phone);
    setEditAvatarUrl(client.avatar || '');
    setEditNationality(client.nationality || 'Rwandan');
    setEditIdNum(client.identificationNumber);
    setEditOccupation(client.occupation || 'Diplomatic Attaché');
    setEditEmployer(client.employer || 'EU Delegation / Private');
    setEditEmName(client.emergencyContact?.name || '');
    setEditEmPhone(client.emergencyContact?.phone || '');
    setEditEmRel(client.emergencyContact?.relationship || 'Spouse');
    setEditNotes(client.notes || '');
    setPayAmount(client.monthlyRent || 850);
  }, [client]);

  // Related Data — these must run on every render, in the same order, regardless of loading
  // state, so they live above the early returns below (Rules of Hooks: a hook can't be skipped
  // on some renders and called on others). Each guards internally for `client` not being loaded yet.
  // Real data, already scoped server-side to this client — no client-side filtering needed.
  const clientDamages = damageReportsQuery.data ?? [];
  const clientPayments = paymentsQuery.data ?? [];
  const clientMaintenance = maintenanceIssuesQuery.data ?? [];

  const pagedPayments = useMemo(() => {
    const start = (payPageIndex - 1) * payPageSize;
    return clientPayments.slice(start, start + payPageSize);
  }, [clientPayments, payPageIndex, payPageSize]);

  if (clientQuery.isLoading) {
    return <div className="py-24 text-center text-sm text-slate-400">Loading resident profile…</div>;
  }

  if (!client) {
    return (
      <div className="text-center py-24 space-y-4">
        <User className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Resident Profile Not Found</h2>
        <p className="text-sm text-slate-500">The requested client record could not be found or has been archived.</p>
        <Link
          to="/operations/clients"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white font-bold text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Resident Directory</span>
        </Link>
      </div>
    );
  }

  // Real clients always have a (possibly empty) documents array from the API now — no more
  // fabricated placeholder documents standing in for ones that were never actually uploaded.
  const documentsList = client.documents || [];

  const totalPaid = clientPayments
    .filter((p) => p.status === 'paid')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalDamagesCost = clientDamages.reduce((acc, curr) => acc + curr.amountCharged, 0);

  // Handlers
  const handleAddDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim()) {
      error('Validation Error', 'Document title is required.');
      return;
    }
    if (!docFileUrl) {
      error('No File Chosen', 'Please choose a file to upload first.');
      return;
    }

    try {
      await addClientDocumentMutation.mutateAsync({
        clientId: client.id,
        input: {
          name: docName.trim(),
          type: docType,
          fileUrl: docFileUrl,
          sizeLabel: docFileSize,
          status: docStatus,
        },
      });
      success('Document Uploaded', `${docName} has been saved to client dossier.`);
      setDocModalOpen(false);
      setDocName('');
      setDocFileUrl('');
      setDocFileSize('');
    } catch {
      error('Upload Failed', 'Could not upload this document. Please try again.');
    }
  };

  const handleDamagePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      try {
        const result = await uploadFileMutation.mutateAsync({ file, folder: 'damage-photos' });
        setDamagePhotos((prev) => [...prev, result.url]);
      } catch {
        error('Upload Failed', `Could not upload ${file.name}.`);
      }
    }
    e.target.value = '';
  };

  const handleRemoveDamagePhoto = (index: number) => {
    setDamagePhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddDamageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!damageItem.trim()) {
      error('Validation Error', 'Damage item name is required.');
      return;
    }
    if (!client.currentRoomId || !client.currentPropertyId) {
      error('No Unit Assigned', 'This resident has no current room assigned — cannot record a damage against no unit.');
      return;
    }

    const input: DamageReportInput = {
      propertyId: client.currentPropertyId,
      roomId: client.currentRoomId,
      clientId: client.id,
      item: damageItem,
      damageType,
      description: damageDesc,
      reportedDate: new Date().toISOString().split('T')[0],
      photos: damagePhotos,
      estimatedCost: Number(damageCost),
      amountCharged: Number(damageCharged),
      responsibleParty: damageResponsible,
    };

    try {
      const created = await createDamageMutation.mutateAsync(input);
      // New reports always start at Pending Review server-side (the create endpoint has no
      // status field — status changes go through a dedicated endpoint, the same pattern already
      // fixed in DamagesManagementPage/AdminUsersRolesPage). Fire it as a second call so picking
      // a different status in this form isn't silently ignored.
      if (damageStatus !== 'Pending Review') {
        await updateDamageStatusMutation.mutateAsync({ id: created.id, status: damageStatus });
      }
      success('Damage Recorded', `Recorded damage on ${damageItem}. Bill/deduction updated.`);
      setDamageModalOpen(false);
      setDamageItem('');
      setDamageDesc('');
      setDamageCost(120);
      setDamageCharged(120);
      setDamageResponsible('Tenant');
      setDamageStatus('Pending Review');
      setDamagePhotos([]);
    } catch (err) {
      error('Save Failed', err instanceof ApiError ? err.message : 'Could not save this damage report. Please try again.');
    }
  };

  const handleAddMaterialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matName.trim()) {
      error('Validation Error', 'Material item name is required.');
      return;
    }

    try {
      // assignedDate is stamped server-side on creation — not sent from here.
      await addClientMaterialMutation.mutateAsync({
        clientId: client.id,
        input: {
          name: matName.trim(),
          quantity: Number(matQuantity),
          condition: matCondition,
          serialNumber: matSerial,
          category: matCategory,
        },
      });
      success('Material Assigned', `Assigned ${matName} to ${client.name}.`);
      setMaterialModalOpen(false);
      setMatName('');
    } catch {
      error('Assignment Failed', 'Could not assign this item. Please try again.');
    }
  };

  const handleAddPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client.currentRoomId || !client.currentPropertyId) {
      error('No Unit Assigned', 'This resident has no current room assigned — cannot record a payment against no unit.');
      return;
    }

    const input: PaymentInput = {
      clientId: client.id,
      propertyId: client.currentPropertyId,
      roomId: client.currentRoomId,
      amount: Number(payAmount),
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      type: payType,
      method: payMethod,
      reference: payRef,
      status: 'paid',
      notes: 'Payment confirmed & verified by Operations Manager',
    };

    try {
      await createPaymentMutation.mutateAsync(input);
      success('Payment Recorded', `Recorded $${payAmount} payment for ${client.name}.`);
      setPaymentModalOpen(false);
    } catch (err) {
      error('Save Failed', err instanceof ApiError ? err.message : 'Could not record this payment. Please try again.');
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateClientMutation.mutateAsync({
        id: client.id,
        input: {
          name: editName,
          email: editEmail,
          phone: editPhone,
          avatarUrl: editAvatarUrl,
          identificationNumber: editIdNum,
          nationality: editNationality,
          occupation: editOccupation,
          employer: editEmployer,
          emergencyContact: { name: editEmName, phone: editEmPhone, relationship: editEmRel },
          currentRoomId: client.currentRoomId,
          currentPropertyId: client.currentPropertyId,
          rentalType: client.rentalType,
          moveInDate: client.moveInDate,
          leaseExpiryDate: client.leaseExpiryDate,
          monthlyRent: client.monthlyRent,
          depositPaid: client.depositPaid,
          notes: editNotes,
        },
      });
      success('Profile Updated', `Updated resident profile for ${editName}.`);
    } catch {
      error('Update Failed', 'Could not update this profile. Please try again.');
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <Link
            to="/operations/clients"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Resident Directory</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 dark:text-white">
              {client.name}
            </h1>
            <Badge
              variant={
                client.status === 'active'
                  ? 'success'
                  : client.status === 'suspended'
                  ? 'danger'
                  : client.status === 'former'
                  ? 'neutral'
                  : 'warning'
              }
              size="sm"
              dot
            >
              {client.status.toUpperCase()} RESIDENT
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            {client.currentPropertyName} • Unit {client.currentRoomNumber} • {client.rentalType}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {client.status === 'active' ? (
            <button
              onClick={() => {
                setStatusTarget('former');
                setStatusReason('Lease Agreement Expired / Checked Out');
                setStatusModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/60 dark:hover:text-rose-300 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors inline-flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
            >
              <UserX className="w-3.5 h-3.5" />
              <span>Deactivate Profile</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setStatusTarget('active');
                setStatusReason('Re-activated by Operations Manager');
                setStatusModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 dark:text-emerald-300 text-xs font-bold transition-colors inline-flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Reactivate Profile</span>
            </button>
          )}

          <button
            onClick={() => setDocModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 hover:text-brand-600 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors inline-flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
          >
            <Upload className="w-3.5 h-3.5 text-brand-500" />
            <span>Upload Document</span>
          </button>

          <button
            onClick={() => setDamageModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 text-xs font-bold transition-colors inline-flex items-center gap-1.5 border border-rose-200 dark:border-rose-800"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span>Record Damage</span>
          </button>

          <button
            onClick={() => setPaymentModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md hover:shadow-glow transition-all inline-flex items-center gap-1.5"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* Inactive / Former / Suspended Status Banner */}
      {client.status !== 'active' && (
        <div
          className={`p-4 sm:p-5 rounded-3xl border shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            client.status === 'suspended'
              ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
              : 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
          }`}
        >
          <div className="flex items-start sm:items-center gap-3">
            <div
              className={`p-2.5 rounded-2xl shrink-0 ${
                client.status === 'suspended'
                  ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300'
                  : 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300'
              }`}
            >
              <Ban className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm">
                  Resident Profile is {client.status.toUpperCase()}
                </span>
                <span className="text-[10px] uppercase tracking-wider font-bold opacity-60">Archived Record</span>
              </div>
              <p className="text-xs opacity-85 leading-relaxed">
                {client.deactivationReason ? `Reason: ${client.deactivationReason}` : 'This client is not currently marked as an active resident.'}
                {client.deactivatedDate ? ` (Recorded on ${client.deactivatedDate})` : ''}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setStatusTarget('active');
              setStatusReason('Re-activated by Operations Manager');
              setStatusModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all whitespace-nowrap self-start sm:self-auto shrink-0 flex items-center gap-1.5"
          >
            <UserCheck className="w-4 h-4" />
            <span>Reactivate Profile</span>
          </button>
        </div>
      )}

      {/* Profile Summary Hero Card */}
      <div className="glass-card p-6 sm:p-7 rounded-3xl shadow-soft border relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
          {/* Avatar & Persona */}
          <div className="flex items-center gap-4 md:col-span-2">
            {client.avatar ? (
              <img
                src={resolveFileUrl(client.avatar)}
                alt={client.name}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-brand-500 shadow-md shrink-0"
              />
            ) : (
              <div
                role="img"
                aria-label={`${client.name} (no profile picture)`}
                className="w-20 h-20 rounded-2xl border-2 border-brand-500 shadow-md shrink-0 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-4xl"
              >
                👤
              </div>
            )}
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold font-display text-slate-900 dark:text-white">
                {client.name}
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold">{client.nationality}</span>
                <span>•</span>
                <span className="font-mono text-[11px]">ID: {client.identificationNumber}</span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400 pt-1">
                <span className="inline-flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {client.email}
                </span>
                <span className="inline-flex items-center gap-1 font-semibold">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {client.phone}
                </span>
              </div>
            </div>
          </div>

          {/* Tenancy snapshot */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400">Current Tenancy</span>
            <p className="font-extrabold text-sm text-slate-900 dark:text-white">
              {client.currentPropertyName}
            </p>
            <p className="font-bold text-brand-600 dark:text-brand-400 font-mono">
              Unit {client.currentRoomNumber} ({client.rentalType})
            </p>
            <p className="text-[11px] text-slate-500">
              Move-in: <strong className="text-slate-700 dark:text-slate-300">{client.moveInDate}</strong>
            </p>
          </div>

          {/* Financial Snapshot */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400">Financial Standing</span>
            <div className="flex items-baseline justify-between">
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-lg font-mono">
                ${client.monthlyRent}/mo
              </span>
              <Badge
                variant={
                  client.paymentStatus === 'paid'
                    ? 'success'
                    : client.paymentStatus === 'pending'
                    ? 'warning'
                    : 'danger'
                }
                size="sm"
              >
                {client.paymentStatus.toUpperCase()}
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500">
              Deposit Paid: <strong className="text-slate-900 dark:text-white">${client.depositPaid}</strong>
            </p>
            <p className="text-[11px] text-slate-500">
              Total Settled: <strong className="text-emerald-600">${totalPaid}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Tabbed Navigation Bar */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800 text-xs">
        {([
          ['overview',     <User className="w-3.5 h-3.5" />,      'Overview'],
          ['documents',    <FileCheck className="w-3.5 h-3.5" />,  `Docs (${documentsList.length})`],
          ['damages',      <AlertTriangle className="w-3.5 h-3.5" />, `Damages (${clientDamages.length})`],
          ['materials',    <Package className="w-3.5 h-3.5" />,    `Assets (${client.materials?.length || 0})`],
          ['payments',     <CreditCard className="w-3.5 h-3.5" />, `Payments (${clientPayments.length})`],
          ['maintenance',  <Wrench className="w-3.5 h-3.5" />,     `Tickets (${clientMaintenance.length})`],
          ['water',        <Droplets className="w-3.5 h-3.5" />,   'Water'],
          ['edit',         <Edit3 className="w-3.5 h-3.5" />,      'Edit'],
        ] as [string, React.ReactNode, string][]).map(([tab, icon, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === tab
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {icon}
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB 1: OVERVIEW & PROFILE                                   */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Primary Details */}
            <div className="glass-card p-6 rounded-3xl border space-y-4">
              <h3 className="text-sm font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-4 h-4 text-brand-600" />
                <span>Personal & Verification Record</span>
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">Full Name</span>
                  <p className="font-bold text-slate-900 dark:text-white">{client.name}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">Nationality</span>
                  <p className="font-medium text-slate-800 dark:text-slate-200">{client.nationality}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">National ID / Passport #</span>
                  <p className="font-mono font-bold text-slate-900 dark:text-white">{client.identificationNumber}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">Occupation / Employer</span>
                  <p className="font-medium text-slate-800 dark:text-slate-200">
                    {client.occupation || 'Executive Specialist'} • {client.employer || 'International Organization'}
                  </p>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="glass-card p-6 rounded-3xl border space-y-4">
              <h3 className="text-sm font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
                <Phone className="w-4 h-4 text-rose-500" />
                <span>Emergency Contact Person</span>
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">Contact Name</span>
                  <p className="font-bold text-slate-900 dark:text-white">{client.emergencyContact?.name || 'Grace Ndahiro'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">Relationship</span>
                  <p className="font-medium text-slate-800 dark:text-slate-200">{client.emergencyContact?.relationship || 'Spouse'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">Emergency Phone</span>
                  <p className="font-bold text-slate-900 dark:text-white font-mono">{client.emergencyContact?.phone || '+250 788 881 223'}</p>
                </div>
              </div>
            </div>

            {/* Tenancy & Agreement */}
            <div className="glass-card p-6 rounded-3xl border space-y-4">
              <h3 className="text-sm font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-emerald-500" />
                <span>Lease Agreement Terms</span>
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">Estate & Unit</span>
                  <p className="font-bold text-slate-900 dark:text-white">{client.currentPropertyName} — Unit {client.currentRoomNumber}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">Move-In Date</span>
                  <p className="font-medium text-slate-800 dark:text-slate-200">{client.moveInDate}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">Lease Expiration</span>
                  <p className="font-medium text-slate-800 dark:text-slate-200">{client.leaseExpiryDate}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">Furnishing Tier</span>
                  <p className="font-bold text-brand-600 dark:text-brand-400">{client.rentalType}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes Card */}
          {client.notes && (
            <div className="p-5 rounded-3xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs">
              <span className="font-bold uppercase text-[10px] text-amber-800 dark:text-amber-300">Manager Notes & Special Tenancy Terms:</span>
              <p className="mt-1 text-slate-700 dark:text-slate-300 leading-relaxed">{client.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB 2: DOCUMENTS & KYC VAULT (CONTRACTS, IDS, PASSPORT)    */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold font-display text-slate-900 dark:text-white">
                Legal Contracts & Identity Verification Documents
              </h3>
              <p className="text-xs text-slate-500">
                Securely store signed tenancy agreements, passport/ID scans, employment letters, and inventory checklists.
              </p>
            </div>

            <button
              onClick={() => setDocModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Upload New Document</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documentsList.map((doc) => (
              <div
                key={doc.id}
                className="glass-card p-5 rounded-3xl border shadow-soft flex flex-col justify-between space-y-4 hover:border-brand-500 transition-all group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 font-extrabold text-[10px] border border-brand-200 dark:border-brand-800">
                      {doc.type}
                    </span>
                    <Badge variant={doc.status === 'Verified' ? 'success' : 'warning'} size="sm">
                      {doc.status}
                    </Badge>
                  </div>

                  <div className="flex items-start gap-3 pt-1">
                    <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-brand-600 dark:text-brand-400 shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-2">
                        {doc.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Uploaded: {doc.uploadDate} {doc.size ? `• ${doc.size}` : ''}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => setPreviewDoc(doc)}
                    className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <a
                      href={resolveFileUrl(doc.fileUrl)}
                      target="_blank"
                      rel="noreferrer"
                      download
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition-colors"
                      title="Download Document"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={async () => {
                        try {
                          await deleteClientDocumentMutation.mutateAsync({ clientId: client.id, documentId: doc.id });
                          info('Document Deleted', 'Document removed from archive.');
                        } catch {
                          error('Delete Failed', 'Could not delete this document.');
                        }
                      }}
                      className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950 hover:bg-rose-100 text-rose-600 dark:text-rose-400 transition-colors"
                      title="Delete Document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB 3: DAMAGES & INCIDENTS                                  */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'damages' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold font-display text-slate-900 dark:text-white">
                Damages & Incident Logs for {client.name}
              </h3>
              <p className="text-xs text-slate-500">
                Track broken materials, wall scratches, appliance repairs, and deposit deductions.
              </p>
            </div>

            <button
              onClick={() => setDamageModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Record New Damage</span>
            </button>
          </div>

          {clientDamages.length === 0 ? (
            <div className="glass-card p-12 rounded-3xl border text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500" />
              <h4 className="font-bold text-base text-slate-900 dark:text-white">No Damage Incidents Reported</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                This resident has a pristine record with zero reported damages or pending deductions.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clientDamages.map((dmg) => (
                <div
                  key={dmg.id}
                  className="glass-card p-5 rounded-3xl border shadow-soft space-y-4 hover:border-rose-400 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-mono text-slate-900 dark:text-white text-sm">
                          {dmg.item}
                        </span>
                        <Badge
                          variant={
                            dmg.status === 'Resolved'
                              ? 'success'
                              : dmg.status === 'In Repair'
                              ? 'info'
                              : 'danger'
                          }
                          size="sm"
                        >
                          {dmg.status}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Reported on {dmg.reportedDate} • Type: {dmg.damageType}
                      </p>
                    </div>

                    <span className="font-extrabold text-rose-600 dark:text-rose-400 font-mono text-base">
                      ${dmg.amountCharged}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    {dmg.description}
                  </p>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-400">
                      Responsible: <strong className="text-slate-800 dark:text-slate-200">{dmg.responsibleParty}</strong>
                    </span>
                    {dmg.photos && dmg.photos.length > 0 && (
                      <a
                        href={resolveFileUrl(dmg.photos[0])}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand-600 dark:text-brand-400 font-bold hover:underline inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Damage Photo</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB 4: ASSIGNED MATERIALS & INVENTORY                       */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'materials' && (() => {
        const materialsList = client.materials || [];
        const countExcellent = materialsList.filter((m) => m.condition === 'Excellent').length;
        const countGood = materialsList.filter((m) => m.condition === 'Good').length;
        const countFair = materialsList.filter((m) => m.condition === 'Fair').length;
        const countNeedsRepair = materialsList.filter((m) => m.condition === 'Needs Repair').length;
        const pagedMaterials = materialsList.slice((matPageIndex - 1) * matPageSize, matPageIndex * matPageSize);

        const getConditionBadgeStyle = (condition: ClientMaterial['condition']) => {
          switch (condition) {
            case 'Excellent':
              return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
            case 'Good':
              return 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800';
            case 'Fair':
              return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800';
            case 'Needs Repair':
              return 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 animate-pulse';
            default:
              return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';
          }
        };

        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold font-display text-slate-900 dark:text-white">
                  Handover Materials & Inventory Checklist
                </h3>
                <p className="text-xs text-slate-500">
                  Track appliances, beds, television units, and furniture delivered to the resident. You can directly update item condition statuses below.
                </p>
              </div>

              <button
                onClick={() => setMaterialModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Assign New Inventory Item</span>
              </button>
            </div>

            {/* Condition Stats Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="glass-card p-3 rounded-2xl border shadow-soft text-center">
                <span className="text-[10px] font-bold uppercase text-slate-400">Total Items</span>
                <p className="text-xl font-extrabold font-mono text-slate-900 dark:text-white">{materialsList.length}</p>
              </div>
              <div className="glass-card p-3 rounded-2xl border shadow-soft text-center bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900">
                <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">Excellent</span>
                <p className="text-xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">{countExcellent}</p>
              </div>
              <div className="glass-card p-3 rounded-2xl border shadow-soft text-center bg-sky-50/40 dark:bg-sky-950/20 border-sky-200 dark:border-sky-900">
                <span className="text-[10px] font-bold uppercase text-sky-600 dark:text-sky-400">Good</span>
                <p className="text-xl font-extrabold font-mono text-sky-600 dark:text-sky-400">{countGood}</p>
              </div>
              <div className="glass-card p-3 rounded-2xl border shadow-soft text-center bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
                <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400">Fair</span>
                <p className="text-xl font-extrabold font-mono text-amber-600 dark:text-amber-400">{countFair}</p>
              </div>
              <div className="glass-card p-3 rounded-2xl border shadow-soft text-center bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900">
                <span className="text-[10px] font-bold uppercase text-rose-600 dark:text-rose-400">Needs Repair</span>
                <p className="text-xl font-extrabold font-mono text-rose-600 dark:text-rose-400">{countNeedsRepair}</p>
              </div>
            </div>

            <div className="glass-card rounded-3xl shadow-soft overflow-hidden border">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold text-[10px] bg-slate-50/50 dark:bg-slate-800/30">
                      <th className="py-3.5 px-6">Item Name</th>
                      <th className="py-3.5 px-4">Serial / Asset Tag</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4">Qty</th>
                      <th className="py-3.5 px-4 min-w-[180px]">Condition Status (Click to Change)</th>
                      <th className="py-3.5 px-4">Handover Date</th>
                      <th className="py-3.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {materialsList.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          No handover inventory items recorded for this client.
                        </td>
                      </tr>
                    ) : (
                      pagedMaterials.map((mat) => (
                        <tr key={mat.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">{mat.name}</td>
                          <td className="py-4 px-4 font-mono text-slate-500">{mat.serialNumber}</td>
                          <td className="py-4 px-4">{mat.category}</td>
                          <td className="py-4 px-4 font-bold">{mat.quantity}x</td>
                          <td className="py-4 px-4">
                            <div className="relative inline-block w-full max-w-[160px]">
                              <select
                                value={mat.condition}
                                onChange={async (e) => {
                                  const newCondition = e.target.value as ClientMaterial['condition'];
                                  try {
                                    await updateClientMaterialConditionMutation.mutateAsync({
                                      clientId: client.id,
                                      materialId: mat.id,
                                      condition: newCondition,
                                    });
                                    success(
                                      'Condition Updated',
                                      `"${mat.name}" status changed to ${newCondition}.`
                                    );
                                  } catch {
                                    error('Update Failed', 'Could not update this item’s condition.');
                                  }
                                }}
                                className={`w-full py-1.5 px-2.5 rounded-xl border text-[11px] font-extrabold cursor-pointer transition-all focus:ring-2 focus:ring-brand-500 shadow-xs ${getConditionBadgeStyle(
                                  mat.condition
                                )}`}
                              >
                                <option value="Excellent" className="bg-white dark:bg-slate-900 text-emerald-600 font-bold">
                                  ✓ Excellent
                                </option>
                                <option value="Good" className="bg-white dark:bg-slate-900 text-sky-600 font-bold">
                                  ● Good
                                </option>
                                <option value="Fair" className="bg-white dark:bg-slate-900 text-amber-600 font-bold">
                                  ▲ Fair
                                </option>
                                <option value="Needs Repair" className="bg-white dark:bg-slate-900 text-rose-600 font-bold">
                                  ⚠ Needs Repair
                                </option>
                              </select>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-slate-500">{mat.assignedDate}</td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {mat.condition === 'Needs Repair' && (
                                <button
                                  onClick={() => {
                                    setDamageItem(mat.name);
                                    setDamageDesc(`Condition degraded to Needs Repair. Serial: ${mat.serialNumber}`);
                                    setDamageStatus('Pending Review');
                                    setDamagePhotos([]);
                                    setDamageModalOpen(true);
                                  }}
                                  title="Log Damage for this item"
                                  className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-300 text-[10px] font-bold border border-rose-200 dark:border-rose-800 transition-colors"
                                >
                                  Log Damage
                                </button>
                              )}
                              <button
                                onClick={async () => {
                                  try {
                                    await deleteClientMaterialMutation.mutateAsync({ clientId: client.id, materialId: mat.id });
                                    info('Inventory Removed', `Removed ${mat.name} from resident list.`);
                                  } catch {
                                    error('Removal Failed', 'Could not remove this item.');
                                  }
                                }}
                                title="Remove asset from resident"
                                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={matPageIndex}
                totalItems={materialsList.length}
                pageSize={matPageSize}
                onPageChange={(p) => setMatPageIndex(p)}
                onPageSizeChange={(s) => { setMatPageSize(s); setMatPageIndex(1); }}
              />
            </div>
          </div>
        );
      })()}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB 5: PAYMENTS & INVOICES                                  */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold font-display text-slate-900 dark:text-white">
                Payment History & Settlement Records
              </h3>
              <p className="text-xs text-slate-500">
                Monthly rent receipts, utilities, and damage settlement transactions.
              </p>
            </div>

            <button
              onClick={() => setPaymentModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Record Payment</span>
            </button>
          </div>

          <div className="glass-card rounded-3xl shadow-soft overflow-hidden border">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold text-[10px] bg-slate-50/50 dark:bg-slate-800/30">
                    <th className="py-3.5 px-6">Invoice #</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Method & Reference</th>
                    <th className="py-3.5 px-4">Payment Date</th>
                    <th className="py-3.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {pagedPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-6 font-bold font-mono text-slate-900 dark:text-white">{p.invoiceNumber}</td>
                      <td className="py-4 px-4 uppercase font-bold text-[10px]">{p.type}</td>
                      <td className="py-4 px-4 font-extrabold text-emerald-600 font-mono text-sm">${p.amount}</td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-slate-900 dark:text-white">{p.method}</span>
                        <span className="text-[10px] text-slate-400 block font-mono">{p.reference}</span>
                      </td>
                      <td className="py-4 px-4">{p.date}</td>
                      <td className="py-4 px-4">
                        <Badge variant={p.status === 'paid' ? 'success' : 'danger'} size="sm">
                          {p.status.toUpperCase()}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={payPageIndex}
              totalItems={clientPayments.length}
              pageSize={payPageSize}
              onPageChange={(p) => setPayPageIndex(p)}
              onPageSizeChange={(s) => { setPayPageSize(s); setPayPageIndex(1); }}
            />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB 6: MAINTENANCE ISSUES                                   */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'maintenance' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold font-display text-slate-900 dark:text-white">
              Service Requests & Maintenance Tickets
            </h3>
            <p className="text-xs text-slate-500">
              Work orders filed for Unit {client.currentRoomNumber}.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clientMaintenance.map((m) => (
              <div key={m.id} className="glass-card p-5 rounded-3xl border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold font-mono text-xs text-brand-600 dark:text-brand-400">
                    {m.ticketNumber}
                  </span>
                  <Badge variant={m.status === 'Resolved' ? 'success' : 'warning'} size="sm">
                    {m.status}
                  </Badge>
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">{m.title}</h4>
                <p className="text-xs text-slate-500">{m.description}</p>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex justify-between">
                  <span>Assigned: {m.assignedTechnicianName || 'In-house maintenance'}</span>
                  <span>Reported: {m.reportedDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB 7: EDIT PROFILE                                         */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'edit' && (
        <form onSubmit={handleProfileSave} className="glass-card p-6 sm:p-8 rounded-3xl border space-y-6 text-xs">
          <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
            Edit Resident Profile & Background
          </h3>

          {/* Profile Picture */}
          <div className="flex items-center gap-4">
            {editAvatarUrl ? (
              <img
                src={resolveFileUrl(editAvatarUrl)}
                alt={editName || client.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-brand-500 shadow-md shrink-0"
              />
            ) : (
              <div
                role="img"
                aria-label="No profile picture"
                className="w-16 h-16 rounded-2xl border-2 border-brand-500 shadow-md shrink-0 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-3xl"
              >
                👤
              </div>
            )}
            <div className="space-y-2">
              <label className="block font-bold uppercase tracking-wider text-slate-500">Profile Picture</label>
              <div className="flex items-center gap-2">
                <FileUploadButton
                  folder="client-avatars"
                  accept="image/*"
                  label={editAvatarUrl ? 'Change Photo' : 'Upload Photo'}
                  onUploaded={(result) => setEditAvatarUrl(result.url)}
                />
                {editAvatarUrl && (
                  <button
                    type="button"
                    onClick={() => setEditAvatarUrl('')}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/60 dark:hover:text-rose-300 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border font-bold"
              />
            </div>
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border"
              />
            </div>
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">Phone Number *</label>
              <input
                type="tel"
                required
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">Nationality</label>
              <input
                type="text"
                value={editNationality}
                onChange={(e) => setEditNationality(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border"
              />
            </div>
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">National ID / Passport #</label>
              <input
                type="text"
                value={editIdNum}
                onChange={(e) => setEditIdNum(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border font-mono"
              />
            </div>
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">Occupation / Profession</label>
              <input
                type="text"
                value={editOccupation}
                onChange={(e) => setEditOccupation(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">Emergency Contact Name</label>
              <input
                type="text"
                value={editEmName}
                onChange={(e) => setEditEmName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border font-bold"
              />
            </div>
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">Emergency Contact Phone</label>
              <input
                type="tel"
                value={editEmPhone}
                onChange={(e) => setEditEmPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border font-mono"
              />
            </div>
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">Relationship</label>
              <input
                type="text"
                value={editEmRel}
                onChange={(e) => setEditEmRel(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">Internal Manager Notes</label>
            <textarea
              rows={3}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border leading-relaxed"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition-all inline-flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Profile Changes</span>
            </button>
          </div>
        </form>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MODAL: UPLOAD DOCUMENTATION (CONTRACTS & IDS)               */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {docModalOpen && (
        <Modal
          isOpen={docModalOpen}
          onClose={() => setDocModalOpen(false)}
          title="Upload Resident Documentation"
          subtitle={`Attaching legal file to ${client.name}'s dossier`}
        >
          <form onSubmit={handleAddDocumentSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">
                Document Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Tenancy_Contract_2026_Signed.pdf"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Document Category *
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border font-bold"
                >
                  <option value="Tenancy Contract">Tenancy Contract</option>
                  <option value="Passport">Passport Copy</option>
                  <option value="National ID">National ID</option>
                  <option value="Proof of Income">Proof of Income</option>
                  <option value="Work Permit">Work Permit</option>
                  <option value="Move-In Inventory">Move-In Inventory Report</option>
                  <option value="Deposit Guarantee">Deposit Guarantee</option>
                  <option value="Other">Other Document</option>
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Verification Status
                </label>
                <select
                  value={docStatus}
                  onChange={(e) => setDocStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border font-bold"
                >
                  <option value="Verified">Verified & Approved</option>
                  <option value="Pending Review">Pending Review</option>
                  <option value="Expired">Expired</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">
                Document File
              </label>
              <div className="flex items-center gap-2">
                <FileUploadButton
                  folder="client-documents"
                  label={docFileUrl ? 'Replace File' : 'Choose File'}
                  onUploaded={(result) => {
                    setDocFileUrl(result.url);
                    setDocFileSize(result.sizeLabel);
                    if (!docName) setDocName(result.originalFilename);
                  }}
                />
                {docFileUrl && (
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">File attached ✓</span>
                )}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md transition-all"
              >
                Upload & Save Document
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MODAL: RECORD DAMAGE REPORT                                 */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {damageModalOpen && (
        <Modal
          isOpen={damageModalOpen}
          onClose={() => setDamageModalOpen(false)}
          title="Record Damage Incident"
          subtitle={`Reporting damage for ${client.name} (Unit ${client.currentRoomNumber})`}
          maxWidth="xl"
        >
          <form onSubmit={handleAddDamageSubmit} className="space-y-4 text-xs">
            {/* Damaged Item & Classification */}
            <div className="space-y-3">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Damage Specifics & Classification *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-1">Damaged Item / Asset *</label>
                  <input
                    type="text"
                    required
                    value={damageItem}
                    onChange={(e) => setDamageItem(e.target.value)}
                    placeholder="e.g. Hardwood Dining Table Glass Top"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-1">Damage Classification *</label>
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
                  <label className="block text-[10px] text-slate-400 font-bold mb-1">Estimated Cost ($) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={damageCost}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setDamageCost(val);
                      if (damageResponsible === 'Tenant') setDamageCharged(val);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-extrabold font-mono text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-1">Tenant Charged ($) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={damageCharged}
                    onChange={(e) => setDamageCharged(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 font-extrabold font-mono text-emerald-600 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-1">Responsible Party *</label>
                  <select
                    value={damageResponsible}
                    onChange={(e) => {
                      const party = e.target.value as DamageReport['responsibleParty'];
                      setDamageResponsible(party);
                      if (party === 'Tenant') setDamageCharged(damageCost);
                      else setDamageCharged(0);
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
                <label className="block text-[10px] text-slate-400 font-bold mb-1">Current Incident Status *</label>
                <select
                  value={damageStatus}
                  onChange={(e) => setDamageStatus(e.target.value as DamageReport['status'])}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                >
                  <option value="Pending Review">Pending Review</option>
                  <option value="In Repair">In Repair</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">Description & Circumstances</label>
                <textarea
                  rows={3}
                  required
                  value={damageDesc}
                  onChange={(e) => setDamageDesc(e.target.value)}
                  placeholder="Detail what caused the damage, parts required for repair, technician assessment..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white text-xs placeholder:text-slate-400 resize-none focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Multiple Photo Upload */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Damage Photos ({damagePhotos.length})
                </label>
                <span className="text-[10px] text-slate-400 font-bold">JPG, PNG, WebP supported</span>
              </div>

              {damagePhotos.length > 0 && (
                <div className="grid grid-cols-3 gap-2.5 mb-3">
                  {damagePhotos.map((p, idx) => (
                    <div
                      key={idx}
                      className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 group h-24 bg-slate-100 dark:bg-slate-800"
                    >
                      <img src={resolveFileUrl(p)} alt={`Damage photo ${idx + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                        <a
                          href={resolveFileUrl(p)}
                          target="_blank"
                          rel="noreferrer"
                          title="View photo full size"
                          className="p-1.5 rounded-lg bg-white/90 text-slate-900 hover:bg-white transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleRemoveDamagePhoto(idx)}
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
                <span className="text-[10px] text-slate-400 mt-0.5">Add multiple pictures taken on-site</span>
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleDamagePhotoUpload} />
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={createDamageMutation.isPending || uploadFileMutation.isPending}
                className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md transition-all disabled:opacity-60 disabled:pointer-events-none"
              >
                {createDamageMutation.isPending ? 'Saving…' : 'Log Damage & Issue Bill'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MODAL: ASSIGN NEW MATERIAL / INVENTORY                      */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {materialModalOpen && (
        <Modal
          isOpen={materialModalOpen}
          onClose={() => setMaterialModalOpen(false)}
          title="Assign Handover Inventory"
          subtitle={`Assigning furniture or appliance to ${client.name}`}
        >
          <form onSubmit={handleAddMaterialSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">
                Item Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Nespresso Vertuo Coffee Machine"
                value={matName}
                onChange={(e) => setMatName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Category
                </label>
                <select
                  value={matCategory}
                  onChange={(e) => setMatCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border font-bold"
                >
                  <option value="Bedroom">Bedroom</option>
                  <option value="Living Room">Living Room</option>
                  <option value="Kitchen">Kitchen</option>
                  <option value="Dining">Dining</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Appliances">Appliances</option>
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Handover Condition
                </label>
                <select
                  value={matCondition}
                  onChange={(e) => setMatCondition(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border font-bold"
                >
                  <option value="Excellent">Excellent (Brand New)</option>
                  <option value="Good">Good Condition</option>
                  <option value="Fair">Fair Condition</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">Quantity</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={matQuantity}
                  onChange={(e) => setMatQuantity(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border font-bold"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">Asset / Serial Tag</label>
                <input
                  type="text"
                  required
                  value={matSerial}
                  onChange={(e) => setMatSerial(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border font-mono"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md transition-all"
              >
                Confirm Inventory Assignment
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MODAL: RECORD PAYMENT                                       */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {paymentModalOpen && (
        <Modal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          title="Record Received Payment"
          subtitle={`Recording payment for ${client.name}`}
        >
          <form onSubmit={handleAddPaymentSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">Amount ($) *</label>
                <input
                  type="number"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border font-extrabold text-emerald-600 font-mono text-base"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">Payment Type</label>
                <select
                  value={payType}
                  onChange={(e) => setPayType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border font-bold"
                >
                  <option value="rent">Monthly Rent</option>
                  <option value="deposit">Security Deposit</option>
                  <option value="utility">Utility Surcharge</option>
                  <option value="maintenance">Damage Compensation</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border font-bold"
                >
                  <option value="Mobile Money">MTN / Airtel Mobile Money</option>
                  <option value="Bank Transfer">Bank Wire (BK / I&M / Equity)</option>
                  <option value="Credit Card">Credit Card (Visa / Mastercard)</option>
                  <option value="Cash">Cash Deposit</option>
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">Transaction Ref</label>
                <input
                  type="text"
                  required
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border font-mono"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={createPaymentMutation.isPending}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all disabled:opacity-60 disabled:pointer-events-none"
              >
                {createPaymentMutation.isPending ? 'Saving…' : 'Confirm Payment & Issue Receipt'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB 8: WATER METER READINGS                                  */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'water' && (() => {
        const meter = (waterMetersQuery.data ?? []).find((w) => w.clientId === client.id);

        return (
          <div className="space-y-6">
            {!meter ? (
              <div className="glass-card p-10 rounded-3xl border text-center space-y-3">
                <Droplets className="w-12 h-12 mx-auto text-sky-300 dark:text-sky-700" />
                <h3 className="font-extrabold text-slate-900 dark:text-white">No Water Meter Assigned</h3>
                <p className="text-xs text-slate-400">No WASAC water meter has been linked to this unit yet. Contact the Operations team to assign a meter number.</p>
              </div>
            ) : (
              <>
                {/* Meter Overview Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Meter Number', value: meter.meterNumber, color: 'text-slate-900 dark:text-white', icon: <Hash className="w-4 h-4 text-sky-500" /> },
                    { label: 'Last Reading (m³)', value: meter.currentReading.toFixed(1), color: 'text-sky-600 dark:text-sky-400', icon: <Droplets className="w-4 h-4 text-sky-500" /> },
                    { label: 'Consumption (m³)', value: meter.consumptionM3.toFixed(1), color: 'text-amber-600', icon: <TrendingUp className="w-4 h-4 text-amber-500" /> },
                    { label: 'Current Bill (USD)', value: `$${meter.totalAmount.toFixed(2)}`, color: meter.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-rose-600', icon: <DollarSign className="w-4 h-4 text-emerald-500" /> },
                  ].map((s) => (
                    <div key={s.label} className="glass-card p-4 rounded-2xl border shadow-soft space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold uppercase text-slate-400">
                        <span>{s.label}</span>
                        {s.icon}
                      </div>
                      <p className={`text-xl font-extrabold font-mono ${s.color}`}>{s.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* Record New Reading */}
                  <div className="glass-card p-6 rounded-3xl border shadow-soft space-y-4">
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <Droplets className="w-4 h-4 text-sky-500" />
                      Record New Reading
                    </h3>

                    <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Meter No.:</span>
                        <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{meter.meterNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Previous Reading:</span>
                        <span className="font-bold font-mono text-sky-700 dark:text-sky-300">{meter.previousReading.toFixed(1)} m³</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Rate per m³:</span>
                        <span className="font-bold font-mono">${meter.ratePerM3}/m³</span>
                      </div>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">New Meter Reading (m³) *</label>
                        <input
                          type="number"
                          step="0.1"
                          min={meter.currentReading}
                          value={newReading || meter.currentReading}
                          onChange={(e) => setNewReading(Number(e.target.value))}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border font-extrabold font-mono text-sky-600 text-base"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold mb-1">Consumption</label>
                        <div className="px-3.5 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 font-extrabold font-mono text-amber-600 text-base">
                          {newReading > meter.currentReading ? `${(newReading - meter.currentReading).toFixed(1)} m³` : '—'}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">Recorded with today's date automatically.</p>
                      </div>

                      {newReading > meter.currentReading && (
                        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                          <span className="font-bold text-slate-600 dark:text-slate-300">Estimated Bill:</span>
                          <span className="font-extrabold text-xl font-mono text-emerald-600">
                            ${((newReading - meter.currentReading) * meter.ratePerM3).toFixed(2)}
                          </span>
                        </div>
                      )}

                      <button
                        onClick={async () => {
                          if (newReading <= meter.currentReading) {
                            error('Invalid Reading', 'New reading must be greater than the previous reading.');
                            return;
                          }
                          try {
                            const updated = await updateWaterMeterReadingMutation.mutateAsync({
                              id: meter.id,
                              currentReading: newReading,
                              newBillingCycle: true,
                            });
                            success(
                              'Reading Saved',
                              `Meter ${updated.meterNumber}: ${updated.consumptionM3.toFixed(1)} m³ consumed → $${updated.totalAmount.toFixed(2)} bill.`
                            );
                            setNewReading(0);
                          } catch (err) {
                            error('Save Failed', err instanceof ApiError ? err.message : 'Could not record this meter reading. Please try again.');
                          }
                        }}
                        disabled={newReading <= meter.currentReading || updateWaterMeterReadingMutation.isPending}
                        className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                      >
                        <Droplets className="w-4 h-4" />
                        {updateWaterMeterReadingMutation.isPending ? 'Saving…' : 'Save New Reading'}
                      </button>
                    </div>
                  </div>

                  {/* Reading History */}
                  <div className="glass-card p-6 rounded-3xl border shadow-soft space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-sky-500" />
                        Consumption History
                      </h3>
                      <Badge variant={meter.paymentStatus === 'paid' ? 'success' : meter.paymentStatus === 'overdue' ? 'danger' : 'warning'} size="sm" dot>
                        {meter.paymentStatus.toUpperCase()}
                      </Badge>
                    </div>

                    {/* Visual consumption bars */}
                    <div className="space-y-2">
                      {(meter.history || []).map((h, idx) => {
                        const max = Math.max(...(meter.history || []).map(x => x.consumption), 1);
                        const pct = Math.round((h.consumption / max) * 100);
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-slate-700 dark:text-slate-300">{h.month}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-slate-400 font-mono">{h.reading.toFixed(1)} m³</span>
                                <span className="font-extrabold text-sky-600 dark:text-sky-400 font-mono">{h.consumption.toFixed(1)} m³</span>
                                <span className="font-bold text-emerald-600 w-14 text-right font-mono">${h.amount.toFixed(2)}</span>
                              </div>
                            </div>
                            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-sky-400 to-sky-600 transition-all duration-700"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Current Bill Status */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Current Billing Period</h4>
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border text-xs space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Reading Date:</span>
                          <span className="font-bold font-mono">{meter.readingDate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Units Consumed:</span>
                          <span className="font-bold font-mono text-sky-600">{meter.consumptionM3} m³</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Rate Applied:</span>
                          <span className="font-bold font-mono">${meter.ratePerM3}/m³</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-1.5 mt-1">
                          <span className="font-extrabold text-slate-700 dark:text-slate-300">Total Bill:</span>
                          <span className="font-extrabold text-lg font-mono text-emerald-600">${meter.totalAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        );
      })()}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MODAL: DOCUMENT PREVIEW                                     */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {previewDoc && (() => {
        const previewUrl = resolveFileUrl(previewDoc.fileUrl);
        const kind = getPreviewKind(previewDoc.fileUrl);
        return (
          <Modal
            isOpen={Boolean(previewDoc)}
            onClose={() => setPreviewDoc(null)}
            title={`Document Preview: ${previewDoc.name}`}
            subtitle={`${previewDoc.type} • Status: ${previewDoc.status}`}
            maxWidth="4xl"
          >
            <div className="space-y-4 text-xs">
              {kind === 'image' ? (
                <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl border p-3 flex items-center justify-center">
                  <img
                    src={previewUrl}
                    alt={previewDoc.name}
                    className="max-h-[65vh] w-auto max-w-full rounded-xl object-contain"
                  />
                </div>
              ) : kind === 'pdf' ? (
                <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl border overflow-hidden">
                  <iframe src={previewUrl} title={previewDoc.name} className="w-full h-[65vh] bg-white" />
                </div>
              ) : (
                <div className="h-80 bg-slate-100 dark:bg-slate-800 rounded-2xl flex flex-col items-center justify-center p-6 text-center border">
                  <FileText className="w-16 h-16 text-brand-500 mb-3" />
                  <p className="font-bold text-sm text-slate-900 dark:text-white">{previewDoc.name}</p>
                  <p className="text-slate-400 mt-1">No inline preview available for this file type.</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <p className="text-[10px] text-slate-400">
                  Uploaded: {previewDoc.uploadDate} {previewDoc.size ? `• ${previewDoc.size}` : ''}
                </p>
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-brand-600 text-white font-bold inline-flex items-center gap-1.5 shadow-sm hover:bg-brand-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open in New Tab</span>
                </a>
              </div>
            </div>
          </Modal>
        );
      })()}
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MODAL: CHANGE STATUS / DEACTIVATE RESIDENT                  */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {statusModalOpen && (
        <Modal
          isOpen={statusModalOpen}
          onClose={() => setStatusModalOpen(false)}
          title={statusTarget === 'active' ? 'Reactivate Resident Profile' : 'Deactivate / Change Profile Status'}
          subtitle={`${client.name} • Unit ${client.currentRoomNumber} (${client.currentPropertyName})`}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await updateClientStatusMutation.mutateAsync({
                  id: client.id,
                  status: statusTarget,
                  reason: statusReason,
                });
                if (statusTarget === 'active') {
                  success('Profile Reactivated', `${client.name}'s profile is now Active.`);
                } else {
                  info(
                    'Status Updated',
                    `${client.name} marked as ${statusTarget.toUpperCase()} (${statusReason}).`
                  );
                }
                setStatusModalOpen(false);
              } catch {
                error('Update Failed', 'Could not update this client’s status. Please try again.');
              }
            }}
            className="space-y-4 text-xs"
          >
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Target Lifecycle Status *
              </label>
              <select
                value={statusTarget}
                onChange={(e) => {
                  const val = e.target.value as Client['status'];
                  setStatusTarget(val);
                  if (val === 'former') setStatusReason('Lease Agreement Expired / Checked Out');
                  else if (val === 'inactive') setStatusReason('Temporarily Inactive / Relocated');
                  else if (val === 'suspended') setStatusReason('Lease Violation / Default on Rent / Blacklisted');
                  else if (val === 'active') setStatusReason('Lease Renewed / Active Resident');
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              >
                <option value="active">Active (Current Resident)</option>
                <option value="former">Former (Lease Completed / Checked Out)</option>
                <option value="inactive">Inactive (Archived / Relocated)</option>
                <option value="suspended">Suspended (Dispute / Non-Payment / Blacklisted)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Reason / Administrative Remarks *
              </label>
              <textarea
                rows={3}
                required
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="Enter details regarding the status change, move-out confirmation, or reason for suspension..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white text-xs placeholder:text-slate-400 resize-none focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>

            {statusTarget !== 'active' && (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Important Notice</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Setting this client to <strong>{statusTarget.toUpperCase()}</strong> will archive their active residency. All past tenancy records, payments, documents, and damage reports remain intact.
                </p>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                className={`w-full py-3 rounded-xl font-bold text-sm shadow-md transition-all text-white ${
                  statusTarget === 'active'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : statusTarget === 'suspended'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-brand-600 hover:bg-brand-700'
                }`}
              >
                {statusTarget === 'active' ? 'Confirm Profile Reactivation' : `Confirm ${statusTarget.toUpperCase()} Status`}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
