import React, { useState, useMemo, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import {
  useTechniciansQuery,
  useCreateTechnicianMutation,
  useAddWorkOrderMutation,
  useUpdateWorkOrderMutation,
  useAddTechDocumentMutation,
} from '../../api/technicians';
import { usePropertiesQuery } from '../../api/properties';
import { useRoomsQuery } from '../../api/rooms';
import { FileUploadButton } from '../../components/common/FileUploadButton';
import {
  Wrench,
  Search,
  Star,
  Phone,
  Mail,
  CheckCircle2,
  Clock,
  Plus,
  Shield,
  Briefcase,
  UserCheck,
  X,
  ChevronRight,
  Award,
  Building,
  DollarSign,
  CreditCard,
  Upload,
  FileText,
  Zap,
  User,
  MapPin,
  Hash,
  AlertTriangle,
  Calendar,
  BarChart3,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Banknote,
  ClipboardList,
  PlusCircle,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Pagination } from '../../components/common/Pagination';
import { Technician, TechWorkOrder, TechDocument } from '../../types';

/* ─── helpers ─── */
const specializations = [
  'Plumber', 'Electrician', 'Carpenter', 'HVAC', 'Painter', 'IT & Security', 'General Maintenance',
] as const;

const availabilityVariant = (a: Technician['availability']) =>
  a === 'Available' ? 'success' : a === 'On Job' ? 'warning' : 'danger';

const specIcon = (spec: Technician['specialization']) => {
  switch (spec) {
    case 'Plumber':          return <Zap className="w-3.5 h-3.5 text-sky-500" />;
    case 'Electrician':      return <Zap className="w-3.5 h-3.5 text-amber-500" />;
    case 'Carpenter':        return <Wrench className="w-3.5 h-3.5 text-orange-500" />;
    case 'HVAC':             return <Wrench className="w-3.5 h-3.5 text-indigo-500" />;
    case 'Painter':          return <Award className="w-3.5 h-3.5 text-rose-500" />;
    case 'IT & Security':    return <Shield className="w-3.5 h-3.5 text-emerald-500" />;
    default:                 return <Wrench className="w-3.5 h-3.5 text-slate-500" />;
  }
};

const priorityColor = (p: TechWorkOrder['priority']) => {
  switch (p) {
    case 'Emergency': return 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700';
    case 'High':      return 'bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700';
    case 'Medium':    return 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700';
    default:          return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  }
};

const woStatusVariant = (s: TechWorkOrder['status']) => {
  switch (s) {
    case 'Completed':   return 'success';
    case 'In Progress': return 'warning';
    case 'Dispatched':  return 'info';
    case 'Cancelled':   return 'danger';
    default:            return 'neutral';
  }
};

const StarRating = ({ value, onChange }: { value: number; onChange?: (v: number) => void }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type="button"
        onClick={() => onChange && onChange(n)}
        className={`transition-colors ${onChange ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
      >
        <Star
          className={`w-4 h-4 ${n <= value ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600'}`}
        />
      </button>
    ))}
  </div>
);

type DossierTab = 'profile' | 'workorders' | 'documents';

/* ─── Main Component ─── */
export const TechniciansPage: React.FC = () => {
  const techniciansQuery = useTechniciansQuery();
  const propertiesQuery = usePropertiesQuery();
  const createTechnicianMutation = useCreateTechnicianMutation();
  const addWorkOrderMutation = useAddWorkOrderMutation();
  const updateWorkOrderMutation = useUpdateWorkOrderMutation();
  const addTechDocumentMutation = useAddTechDocumentMutation();
  const { success, error } = useToast();

  const technicians = techniciansQuery.data ?? [];
  const properties = propertiesQuery.data ?? [];
  const isLoading = techniciansQuery.isLoading || propertiesQuery.isLoading;

  const [searchQuery, setSearchQuery] = useState('');
  const [specFilter, setSpecFilter]   = useState('all');
  const [availFilter, setAvailFilter] = useState('all');
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(9);

  /* ── Dossier panel ── */
  const [dossierTechId, setDossierTechId]     = useState<string | null>(null);
  const [dossierTab, setDossierTab]           = useState<DossierTab>('profile');
  const activeTech = dossierTechId ? technicians.find((t) => t.id === dossierTechId) ?? null : null;

  /* ── Work Order form ── */
  const [woFormOpen, setWoFormOpen]     = useState(false);
  const [woTitle, setWoTitle]           = useState('');
  const [woPropertyId, setWoPropertyId] = useState('');
  const [woRoomId, setWoRoomId]         = useState('');
  const [woCategory, setWoCategory]     = useState<TechWorkOrder['category']>('Plumbing');
  const [woPriority, setWoPriority]     = useState<TechWorkOrder['priority']>('Medium');
  const [woDescription, setWoDescription] = useState('');
  const [woDispatchDate, setWoDispatchDate] = useState(new Date().toISOString().slice(0, 10));
  const [woEstHours, setWoEstHours]     = useState(2);
  const [woLaborCost, setWoLaborCost]   = useState(50);
  const [woMaterialCost, setWoMaterialCost] = useState(0);

  /* ── Rating modal ── */
  const [ratingWo, setRatingWo]       = useState<TechWorkOrder | null>(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState('');

  /* ── Payment modal ── */
  const [payWo, setPayWo]         = useState<TechWorkOrder | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payRef, setPayRef]       = useState('');
  const [payMethod, setPayMethod] = useState<'Mobile Money' | 'Bank Transfer' | 'Cash'>('Mobile Money');

  /* ── Doc upload form ── */
  const [docFormOpen, setDocFormOpen]   = useState(false);
  const [docName, setDocName]           = useState('');
  const [docType, setDocType]           = useState<TechDocument['type']>('License');
  const [docFile, setDocFile]           = useState<string | null>(null);
  const [docFileName, setDocFileName]   = useState<string | null>(null);
  const [docExpiry, setDocExpiry]       = useState('');

  /* ── Add Technician drawer ── */
  const [addDrawerOpen, setAddDrawerOpen]     = useState(false);
  const [newName, setNewName]                 = useState('');
  const [newCompany, setNewCompany]           = useState('');
  const [newContact, setNewContact]           = useState('');
  const [newEmail, setNewEmail]               = useState('');
  const [newSpec, setNewSpec]                 = useState<Technician['specialization']>('Plumber');
  const [newRate, setNewRate]                 = useState(25);
  const [newYears, setNewYears]               = useState(3);
  const [newAddress, setNewAddress]           = useState('');
  const [newNationalId, setNewNationalId]     = useState('');
  const [newPayMethod, setNewPayMethod]       = useState<'Mobile Money' | 'Bank Transfer' | 'Cash'>('Mobile Money');
  const [newPayAccount, setNewPayAccount]     = useState('');
  const [newCerts, setNewCerts]               = useState('');
  const [newNotes, setNewNotes]               = useState('');

  const roomsQuery = useRoomsQuery({ propertyId: woPropertyId || undefined });
  const rooms = roomsQuery.data ?? [];

  useEffect(() => {
    if (!woPropertyId && properties.length > 0) setWoPropertyId(properties[0].id);
  }, [properties, woPropertyId]);

  useEffect(() => {
    // Clear the selected room whenever it's no longer valid for the currently-selected property.
    if (woRoomId && !rooms.some((r) => r.id === woRoomId)) setWoRoomId('');
  }, [rooms, woRoomId]);

  const filteredTechs = useMemo(() => technicians.filter((t) => {
    if (specFilter  !== 'all' && t.specialization !== specFilter)  return false;
    if (availFilter !== 'all' && t.availability   !== availFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return t.name.toLowerCase().includes(q) || t.company.toLowerCase().includes(q) || t.specialization.toLowerCase().includes(q);
    }
    return true;
  }), [technicians, specFilter, availFilter, searchQuery]);

  const pagedTechs = useMemo(() => {
    const start = (pageIndex - 1) * pageSize;
    return filteredTechs.slice(start, start + pageSize);
  }, [filteredTechs, pageIndex, pageSize]);

  /* computed for active tech */
  const workOrders  = activeTech?.workOrders  || [];
  const documents   = activeTech?.documents   || [];
  const totalEarned = workOrders.reduce((s, w) => s + w.totalCost, 0);
  const totalPaid   = workOrders.reduce((s, w) => s + w.paidAmount, 0);
  const outstanding = totalEarned - totalPaid;
  const avgRating   = workOrders.filter((w) => w.rating).reduce((s, w, _, a) => s + (w.rating || 0) / a.length, 0);

  const handleDispatchWO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTech) return;
    if (!woTitle.trim() || !woDescription.trim()) { error('Required', 'Please fill title and description.'); return; }
    try {
      const created = await addWorkOrderMutation.mutateAsync({
        technicianId: activeTech.id,
        input: {
          propertyId: woPropertyId,
          roomId: woRoomId || undefined,
          title: woTitle.trim(),
          description: woDescription.trim(),
          category: woCategory,
          priority: woPriority,
          dispatchedDate: woDispatchDate,
          estimatedHours: woEstHours,
        },
      });
      // The create endpoint has no labor/material cost fields — set them via a follow-up update.
      if (woLaborCost || woMaterialCost) {
        await updateWorkOrderMutation.mutateAsync({
          technicianId: activeTech.id,
          workOrderId: created.id,
          input: {
            laborCost: woLaborCost,
            materialCost: woMaterialCost,
            paymentStatus: created.paymentStatus,
            paidAmount: created.paidAmount,
            status: created.status,
          },
        });
      }
      success('Work Order Dispatched', `${woTitle} assigned to ${activeTech.name}.`);
      setWoFormOpen(false);
      setWoTitle(''); setWoDescription(''); setWoRoomId(''); setWoLaborCost(50); setWoMaterialCost(0);
    } catch {
      error('Dispatch Failed', 'Could not dispatch this work order. Please try again.');
    }
  };

  const handleSaveRating = async () => {
    if (!activeTech || !ratingWo) return;
    try {
      await updateWorkOrderMutation.mutateAsync({
        technicianId: activeTech.id,
        workOrderId: ratingWo.id,
        input: {
          priority: ratingWo.priority,
          startDate: ratingWo.startDate,
          completedDate: ratingWo.completedDate,
          actualHours: ratingWo.actualHours,
          laborCost: ratingWo.laborCost,
          materialCost: ratingWo.materialCost,
          paymentStatus: ratingWo.paymentStatus,
          paidAmount: ratingWo.paidAmount,
          status: ratingWo.status,
          rating: ratingValue,
          ratingComment: ratingComment.trim(),
          photos: ratingWo.photos,
          notes: ratingWo.notes,
        },
      });
      success('Rating Saved', `Rated ${ratingValue}/5 for job ${ratingWo.jobNumber}.`);
      setRatingWo(null); setRatingComment('');
    } catch {
      error('Save Failed', 'Could not save this rating. Please try again.');
    }
  };

  const handleRecordPayment = async () => {
    if (!activeTech || !payWo) return;
    if (!payRef.trim()) { error('Reference Required', 'Enter a transaction reference.'); return; }
    const newPaid = payWo.paidAmount + payAmount;
    const newStatus: TechWorkOrder['paymentStatus'] = newPaid >= payWo.totalCost ? 'Paid' : 'Partially Paid';
    try {
      await updateWorkOrderMutation.mutateAsync({
        technicianId: activeTech.id,
        workOrderId: payWo.id,
        input: {
          priority: payWo.priority,
          startDate: payWo.startDate,
          completedDate: payWo.completedDate,
          actualHours: payWo.actualHours,
          laborCost: payWo.laborCost,
          materialCost: payWo.materialCost,
          paymentStatus: newStatus,
          paidAmount: newPaid,
          status: payWo.status,
          rating: payWo.rating,
          ratingComment: payWo.ratingComment,
          photos: payWo.photos,
          notes: payWo.notes,
        },
      });
      success('Payment Recorded', `$${payAmount} settled for ${payWo.jobNumber}.`);
      setPayWo(null); setPayRef(''); setPayAmount(0);
    } catch {
      error('Save Failed', 'Could not record this payment. Please try again.');
    }
  };

  const handleAddDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTech || !docName.trim() || !docFile) { error('Required', 'Fill name and upload a file.'); return; }
    try {
      await addTechDocumentMutation.mutateAsync({
        technicianId: activeTech.id,
        input: { name: docName.trim(), type: docType, fileUrl: docFile, expiryDate: docExpiry || undefined, status: 'Valid' },
      });
      success('Document Uploaded', `${docName} added to ${activeTech.name}'s profile.`);
      setDocFormOpen(false); setDocName(''); setDocFile(null); setDocFileName(null); setDocExpiry('');
    } catch {
      error('Upload Failed', 'Could not upload this document. Please try again.');
    }
  };

  const handleAddTech = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newCompany.trim() || !newContact.trim()) { error('Required', 'Fill all required fields.'); return; }
    try {
      await createTechnicianMutation.mutateAsync({
        name: newName.trim(),
        company: newCompany.trim(),
        contact: newContact.trim(),
        email: newEmail.trim(),
        specialization: newSpec,
        hourlyRate: newRate,
        yearsExperience: newYears,
        address: newAddress.trim() || undefined,
        nationalId: newNationalId.trim() || undefined,
        preferredPaymentMethod: newPayMethod,
        payoutAccount: newPayAccount.trim() || undefined,
        certifications: newCerts.trim() ? newCerts.split(',').map((c) => c.trim()) : [],
        notes: newNotes.trim() || undefined,
      });
      success('Technician Registered', `${newName} has been added to the contractor network.`);
      setAddDrawerOpen(false);
      setNewName(''); setNewCompany(''); setNewContact(''); setNewEmail(''); setNewCerts(''); setNewNotes('');
    } catch {
      error('Registration Failed', 'Could not register this technician. Please try again.');
    }
  };

  /* ─── render ─── */
  if (isLoading) {
    return <div className="py-24 text-center text-sm text-slate-400">Loading technicians…</div>;
  }

  return (
    <div className="space-y-8 pb-16">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 px-2.5 py-1 rounded-full border border-brand-200 dark:border-brand-800 mb-1">
            <Wrench className="w-3.5 h-3.5" />
            <span>Contractor & Service Network</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 dark:text-white">
            Professional Technicians Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Verified plumbers, electricians, HVAC specialists, carpenters, and painters for rapid dispatch.
          </p>
        </div>
        <button
          onClick={() => setAddDrawerOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md hover:shadow-glow transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Technician</span>
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Contractors', value: technicians.length, color: 'text-brand-600', icon: <UserCheck className="w-4 h-4 text-brand-500" /> },
          { label: 'Available Now', value: technicians.filter(t=>t.availability==='Available').length, color: 'text-emerald-600', icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" /> },
          { label: 'Currently On Job', value: technicians.filter(t=>t.availability==='On Job').length, color: 'text-amber-600', icon: <Briefcase className="w-4 h-4 text-amber-500" /> },
          { label: 'Total Fees Disbursed', value: `$${technicians.reduce((s,t)=>s+t.totalPaid,0).toLocaleString()}`, color: 'text-slate-900 dark:text-white', icon: <DollarSign className="w-4 h-4 text-emerald-500" /> },
        ].map((s) => (
          <div key={s.label} className="glass-card p-4 rounded-2xl border shadow-soft space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase text-slate-400">
              <span>{s.label}</span>
              {s.icon}
            </div>
            <p className={`text-2xl font-extrabold font-display ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-card p-4 rounded-2xl shadow-soft flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input type="text" placeholder="Search by name, company, or specialty…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-brand-500" />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select value={specFilter} onChange={(e) => setSpecFilter(e.target.value)} className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold">
            <option value="all">All Specializations</option>
            {specializations.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={availFilter} onChange={(e) => setAvailFilter(e.target.value)} className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold">
            <option value="all">All Availability</option>
            <option value="Available">Available Now</option>
            <option value="On Job">On Job</option>
            <option value="Unavailable">Unavailable</option>
          </select>
        </div>
      </div>

      {/* Technicians Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {pagedTechs.map((tech) => {
          const woCount  = (tech.workOrders || []).length;
          const avgRat   = (tech.workOrders || []).filter(w=>w.rating).reduce((s,w,_,a)=>s+(w.rating||0)/a.length,0);

          return (
            <div
              key={tech.id}
              className="glass-card p-5 rounded-3xl shadow-soft flex flex-col justify-between space-y-4 border hover:border-brand-400/60 hover:shadow-glow/10 transition-all cursor-pointer"
              onClick={() => { setDossierTechId(tech.id); setDossierTab('profile'); }}
            >
              <div className="space-y-3">
                {/* Avatar + name */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img src={tech.avatar} alt={tech.name} className="w-12 h-12 rounded-2xl object-cover border-2 border-white dark:border-slate-700 shadow-sm" />
                      <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-800 ${tech.availability === 'Available' ? 'bg-emerald-500' : tech.availability === 'On Job' ? 'bg-amber-500' : 'bg-slate-400'}`} />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">{tech.name}</h3>
                      <p className="text-xs text-slate-500 font-medium">{tech.company}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-0.5">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{avgRat > 0 ? avgRat.toFixed(1) : tech.rating}</span>
                    </div>
                    <Badge variant={availabilityVariant(tech.availability)} size="sm" dot>{tech.availability}</Badge>
                  </div>
                </div>

                {/* Spec + years */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 border">
                    {specIcon(tech.specialization)}{tech.specialization}
                  </span>
                  {tech.yearsExperience && (
                    <span className="text-[11px] text-slate-500 font-medium">{tech.yearsExperience} yrs exp</span>
                  )}
                </div>

                {/* Metrics */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border text-xs space-y-1.5">
                  <div className="flex justify-between"><span className="text-slate-400">Work Orders Done:</span><span className="font-bold text-slate-900 dark:text-white">{tech.totalJobs} jobs</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Fees Settled:</span><span className="font-bold text-emerald-600">${tech.totalPaid.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Hourly Rate:</span><span className="font-semibold">${tech.hourlyRate || 25}/hr</span></div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="text-xs">
                  <p className="font-bold text-slate-900 dark:text-white">{tech.contact}</p>
                  <p className="text-[10px] text-slate-400 truncate max-w-[130px]">{tech.email}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setDossierTechId(tech.id); setDossierTab('workorders'); setWoFormOpen(true); }}
                  className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1"
                >
                  <Flag className="w-3.5 h-3.5" /> Dispatch
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Technicians Pagination */}
      <div className="glass-card rounded-3xl overflow-hidden border shadow-soft">
        <Pagination
          currentPage={pageIndex}
          totalItems={filteredTechs.length}
          pageSize={pageSize}
          onPageChange={(p) => setPageIndex(p)}
          onPageSizeChange={(s) => { setPageSize(s); setPageIndex(1); }}
          pageSizeOptions={[6, 9, 12, 24]}
        />
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/*  DOSSIER SIDE PANEL                                                  */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div
        className={`fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs transition-opacity duration-300 ${activeTech ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => { setDossierTechId(null); setWoFormOpen(false); setRatingWo(null); setPayWo(null); setDocFormOpen(false); }}
      />
      <aside className={`fixed right-0 top-0 h-full z-50 w-full max-w-2xl bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out ${activeTech ? 'translate-x-0' : 'translate-x-full'}`}>
        {activeTech && (
          <>
            {/* Panel header */}
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-brand-600/10 to-transparent flex items-start justify-between gap-3">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img src={activeTech.avatar} alt={activeTech.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-white dark:border-slate-700 shadow-md" />
                  <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 ${activeTech.availability === 'Available' ? 'bg-emerald-500' : activeTech.availability === 'On Job' ? 'bg-amber-500' : 'bg-slate-400'}`} />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold font-display text-slate-900 dark:text-white">{activeTech.name}</h2>
                  <p className="text-xs font-semibold text-slate-500">{activeTech.company}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-bold border">{specIcon(activeTech.specialization)}{activeTech.specialization}</span>
                    <Badge variant={availabilityVariant(activeTech.availability)} size="sm" dot>{activeTech.availability}</Badge>
                  </div>
                </div>
              </div>
              <button onClick={() => setDossierTechId(null)} className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors shrink-0"><X className="w-5 h-5" /></button>
            </div>

            {/* Financial summary strip */}
            <div className="grid grid-cols-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40">
              {[
                { label: 'Work Orders', value: workOrders.length, color: 'text-slate-900 dark:text-white' },
                { label: 'Total Earned', value: `$${totalEarned.toLocaleString()}`, color: 'text-slate-900 dark:text-white' },
                { label: 'Total Paid', value: `$${totalPaid.toLocaleString()}`, color: 'text-emerald-600' },
                { label: 'Outstanding', value: `$${outstanding.toLocaleString()}`, color: outstanding > 0 ? 'text-rose-600' : 'text-slate-400' },
              ].map((s) => (
                <div key={s.label} className="p-3 text-center border-r border-slate-100 dark:border-slate-800 last:border-0">
                  <p className="text-[10px] font-bold uppercase text-slate-400">{s.label}</p>
                  <p className={`text-base font-extrabold font-mono ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800">
              {([['profile','Profile & Info'],['workorders','Work Orders'],['documents','Documents']] as [DossierTab,string][]).map(([tab, label]) => (
                <button
                  key={tab}
                  onClick={() => setDossierTab(tab)}
                  className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide transition-colors ${dossierTab === tab ? 'border-b-2 border-brand-600 text-brand-600 dark:text-brand-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* ── TAB: Profile ── */}
            {dossierTab === 'profile' && (
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 text-xs">
                {/* Contact details */}
                <div className="glass-card p-4 rounded-2xl border space-y-2.5">
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5"><User className="w-4 h-4 text-brand-500" /> Contact Details</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Phone', value: activeTech.contact, icon: <Phone className="w-3.5 h-3.5 text-brand-500" /> },
                      { label: 'Email', value: activeTech.email, icon: <Mail className="w-3.5 h-3.5 text-brand-500" /> },
                      { label: 'Address', value: activeTech.address || '—', icon: <MapPin className="w-3.5 h-3.5 text-brand-500" /> },
                      { label: 'National ID', value: activeTech.nationalId || '—', icon: <Hash className="w-3.5 h-3.5 text-brand-500" /> },
                      { label: 'Yrs Experience', value: activeTech.yearsExperience ? `${activeTech.yearsExperience} years` : '—', icon: <Calendar className="w-3.5 h-3.5 text-brand-500" /> },
                      { label: 'Hourly Rate', value: `$${activeTech.hourlyRate || 25}/hr`, icon: <DollarSign className="w-3.5 h-3.5 text-brand-500" /> },
                    ].map((f) => (
                      <div key={f.label} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border space-y-0.5">
                        <p className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">{f.icon}{f.label}</p>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{f.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Emergency contact */}
                {activeTech.emergencyContact && (
                  <div className="glass-card p-4 rounded-2xl border space-y-2">
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 text-amber-500" /> Emergency Contact</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border"><p className="text-[10px] font-bold text-slate-400 uppercase">Name</p><p className="font-semibold">{activeTech.emergencyContact.name}</p></div>
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border"><p className="text-[10px] font-bold text-slate-400 uppercase">Phone</p><p className="font-semibold">{activeTech.emergencyContact.phone}</p></div>
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border"><p className="text-[10px] font-bold text-slate-400 uppercase">Relation</p><p className="font-semibold">{activeTech.emergencyContact.relationship}</p></div>
                    </div>
                  </div>
                )}

                {/* Certifications */}
                {(activeTech.certifications || []).length > 0 && (
                  <div className="glass-card p-4 rounded-2xl border space-y-2">
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5"><Award className="w-4 h-4 text-amber-500" /> Licenses & Certifications</h4>
                    <div className="flex flex-wrap gap-2">
                      {(activeTech.certifications || []).map((c) => (
                        <span key={c} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-[11px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />{c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Payout info */}
                <div className="glass-card p-4 rounded-2xl border space-y-2">
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5"><Banknote className="w-4 h-4 text-emerald-500" /> Payment Account</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border"><p className="text-[10px] font-bold text-slate-400 uppercase">Method</p><p className="font-semibold">{activeTech.preferredPaymentMethod || '—'}</p></div>
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border"><p className="text-[10px] font-bold text-slate-400 uppercase">Account / Float</p><p className="font-semibold truncate">{activeTech.payoutAccount || '—'}</p></div>
                  </div>
                </div>

                {/* Notes */}
                {activeTech.notes && (
                  <div className="p-4 rounded-2xl bg-brand-50/60 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800">
                    <h4 className="font-extrabold text-xs uppercase text-brand-600 dark:text-brand-400 mb-1.5">Field Notes</h4>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{activeTech.notes}</p>
                  </div>
                )}

                {/* Rating overview */}
                <div className="glass-card p-4 rounded-2xl border space-y-2">
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5"><BarChart3 className="w-4 h-4 text-brand-500" /> Performance Overview</h4>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-3xl font-extrabold font-display text-amber-500">{avgRating > 0 ? avgRating.toFixed(1) : '—'}</p>
                      {avgRating > 0 && <StarRating value={Math.round(avgRating)} />}
                      <p className="text-[10px] text-slate-400 mt-0.5">Average Rating</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 flex-1 text-center">
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border"><p className="text-xs font-extrabold text-emerald-600">{workOrders.filter(w=>w.status==='Completed').length}</p><p className="text-[10px] text-slate-400">Completed</p></div>
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border"><p className="text-xs font-extrabold text-amber-500">{workOrders.filter(w=>w.status==='In Progress').length}</p><p className="text-[10px] text-slate-400">In Progress</p></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB: Work Orders ── */}
            {dossierTab === 'workorders' && (
              <div className="flex-1 overflow-y-auto flex flex-col">
                {/* Dispatch button + form */}
                <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40">
                  {!woFormOpen ? (
                    <button onClick={() => setWoFormOpen(true)} className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all">
                      <PlusCircle className="w-4 h-4" /> Dispatch New Work Order
                    </button>
                  ) : (
                    <form onSubmit={handleDispatchWO} className="space-y-3 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-1.5"><Flag className="w-4 h-4 text-brand-500"/>New Work Order</span>
                        <button type="button" onClick={() => setWoFormOpen(false)} className="text-slate-400 hover:text-slate-700"><X className="w-4 h-4"/></button>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold mb-1">Job Title *</label>
                        <input type="text" required value={woTitle} onChange={e=>setWoTitle(e.target.value)} placeholder="e.g. Bathroom pipe leak repair" className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"/>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-400 font-bold mb-1">Property *</label>
                          <select value={woPropertyId} onChange={e=>setWoPropertyId(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all">
                            {properties.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 font-bold mb-1">Unit / Area</label>
                          <select value={woRoomId} onChange={e=>setWoRoomId(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all">
                            <option value="">-- Whole Property / N/A --</option>
                            {rooms.map(r=><option key={r.id} value={r.id}>Unit {r.roomNumber}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-400 font-bold mb-1">Category *</label>
                          <select value={woCategory} onChange={e=>setWoCategory(e.target.value as any)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all">
                            {['Plumbing','Electrical','Carpentry','HVAC','Painting','IT & Security','General'].map(c=><option key={c}>{c}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 font-bold mb-1">Priority *</label>
                          <select value={woPriority} onChange={e=>setWoPriority(e.target.value as any)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all">
                            {['Low','Medium','High','Emergency'].map(p=><option key={p}>{p}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold mb-1">Description & Scope *</label>
                        <textarea rows={2} required value={woDescription} onChange={e=>setWoDescription(e.target.value)} placeholder="Describe the technical repair required, parts needed…" className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white text-xs placeholder:text-slate-400 resize-none focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"/>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-400 font-bold mb-1">Dispatch Date</label>
                          <input type="date" value={woDispatchDate} onChange={e=>setWoDispatchDate(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"/>
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 font-bold mb-1">Est. Hours</label>
                          <input type="number" min={0.5} step={0.5} value={woEstHours} onChange={e=>setWoEstHours(Number(e.target.value))} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"/>
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 font-bold mb-1">Labor Cost ($)</label>
                          <input type="number" value={woLaborCost} onChange={e=>setWoLaborCost(Number(e.target.value))} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-extrabold text-brand-600 font-mono text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"/>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold mb-1">Material Cost ($)</label>
                        <input type="number" value={woMaterialCost} onChange={e=>setWoMaterialCost(Number(e.target.value))} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-extrabold text-brand-600 font-mono text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"/>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800">
                        <span className="font-bold text-slate-600 dark:text-slate-300 text-xs">Total Cost:</span>
                        <span className="font-extrabold text-lg font-mono text-brand-600">${woLaborCost + woMaterialCost}</span>
                      </div>
                      <button type="submit" className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all">
                        <Flag className="w-3.5 h-3.5"/> Confirm & Dispatch
                      </button>
                    </form>
                  )}
                </div>

                {/* Work Orders List */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                  {workOrders.length === 0 && (
                    <div className="py-12 text-center text-slate-400">
                      <ClipboardList className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2"/>
                      <p className="font-semibold">No work orders yet.</p>
                      <p className="text-[11px] mt-1">Dispatch a job using the button above.</p>
                    </div>
                  )}
                  {workOrders.map((wo) => (
                    <div key={wo.id} className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
                      {/* WO Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">{wo.jobNumber}</p>
                          <h5 className="font-extrabold text-sm text-slate-900 dark:text-white">{wo.title}</h5>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Building className="w-3 h-3 text-brand-500"/>{wo.propertyName}{wo.roomNumber ? ` — Unit ${wo.roomNumber}` : ''}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <Badge variant={woStatusVariant(wo.status)} size="sm" dot>{wo.status}</Badge>
                          <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg border text-[9px] font-extrabold ${priorityColor(wo.priority)}`}><Flag className="w-2.5 h-2.5"/>{wo.priority}</span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">{wo.description}</p>

                      {/* Dates + Hours */}
                      <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                        <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border text-center"><p className="text-slate-400 font-bold uppercase text-[9px]">Dispatched</p><p className="font-bold text-slate-700 dark:text-slate-300">{wo.dispatchedDate}</p></div>
                        <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border text-center"><p className="text-slate-400 font-bold uppercase text-[9px]">Est. Hrs</p><p className="font-bold">{wo.estimatedHours}h{wo.actualHours ? ` / ${wo.actualHours}h actual` : ''}</p></div>
                        <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border text-center"><p className="text-slate-400 font-bold uppercase text-[9px]">Total Cost</p><p className="font-extrabold text-brand-600 font-mono">${wo.totalCost}</p></div>
                      </div>

                      {/* Payment row */}
                      <div className="flex items-center justify-between p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800/60">
                        <div>
                          <p className="text-[10px] font-bold uppercase text-slate-400">Payment</p>
                          <p className={`font-extrabold text-sm font-mono ${wo.paymentStatus === 'Paid' ? 'text-emerald-600' : wo.paymentStatus === 'Partially Paid' ? 'text-amber-500' : 'text-rose-600'}`}>
                            ${wo.paidAmount} / ${wo.totalCost}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {wo.paymentStatus !== 'Paid' && (
                            <button onClick={() => { setPayWo(wo); setPayAmount(wo.totalCost - wo.paidAmount); }} className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs transition-colors">
                              <DollarSign className="w-3 h-3"/> Pay
                            </button>
                          )}
                          <button onClick={() => { setRatingWo(wo); setRatingValue(wo.rating || 5); setRatingComment(wo.ratingComment || ''); }} className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-amber-500 transition-colors" title="Rate Work Order">
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400"/>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── TAB: Documents ── */}
            {dossierTab === 'documents' && (
              <div className="flex-1 overflow-y-auto flex flex-col">
                {/* Upload form */}
                <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40">
                  {!docFormOpen ? (
                    <button onClick={() => setDocFormOpen(true)} className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all">
                      <Upload className="w-4 h-4"/> Upload Document
                    </button>
                  ) : (
                    <form onSubmit={handleAddDoc} className="space-y-3 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-1.5"><Upload className="w-4 h-4 text-brand-500"/>Upload Document</span>
                        <button type="button" onClick={() => setDocFormOpen(false)} className="text-slate-400 hover:text-slate-700"><X className="w-4 h-4"/></button>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold mb-1">Document Name *</label>
                        <input type="text" required value={docName} onChange={e=>setDocName(e.target.value)} placeholder="e.g. Rwanda RURA Plumbing License 2026" className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"/>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] text-slate-400 font-bold mb-1">Document Type *</label>
                          <select value={docType} onChange={e=>setDocType(e.target.value as any)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all">
                            {['License','Certification','Contract','Insurance','ID','Invoice','Other'].map(t=><option key={t}>{t}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 font-bold mb-1">Expiry Date</label>
                          <input type="date" value={docExpiry} onChange={e=>setDocExpiry(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"/>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold mb-1">File Upload *</label>
                        <FileUploadButton
                          folder="technician-documents"
                          accept="image/*,application/pdf"
                          label={docFileName ? docFileName : 'Choose File'}
                          className="w-full justify-center"
                          onUploaded={(result) => { setDocFile(result.url); setDocFileName(result.originalFilename); }}
                        />
                      </div>
                      <button type="submit" className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all">
                        <Upload className="w-3.5 h-3.5"/> Save Document
                      </button>
                    </form>
                  )}
                </div>

                {/* Docs list */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                  {documents.length === 0 && (
                    <div className="py-12 text-center text-slate-400">
                      <FileText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2"/>
                      <p className="font-semibold">No documents uploaded yet.</p>
                    </div>
                  )}
                  {documents.map((doc) => (
                    <div key={doc.id} className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-xs flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 shrink-0">
                          <FileText className="w-5 h-5 text-brand-600 dark:text-brand-400"/>
                        </div>
                        <div>
                          <p className="font-extrabold text-sm text-slate-900 dark:text-white">{doc.name}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">Type: <strong>{doc.type}</strong> · Uploaded: {doc.uploadDate}</p>
                          {doc.expiryDate && <p className="text-[11px] text-amber-600 font-semibold">Expires: {doc.expiryDate}</p>}
                        </div>
                      </div>
                      <Badge variant={doc.status === 'Valid' ? 'success' : doc.status === 'Expired' ? 'danger' : 'warning'} size="sm">{doc.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </aside>

      {/* ── Rating Modal ── */}
      {ratingWo && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setRatingWo(null)}/>
          <div className="relative z-10 w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Rate Work Quality</h3>
              <button onClick={() => setRatingWo(null)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-4 h-4 text-slate-400"/></button>
            </div>
            <p className="text-xs text-slate-500 font-semibold">{ratingWo.jobNumber} — {ratingWo.title}</p>
            <div className="flex justify-center py-2">
              <StarRating value={ratingValue} onChange={setRatingValue}/>
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">Comment (optional)</label>
              <textarea rows={2} value={ratingComment} onChange={e=>setRatingComment(e.target.value)} placeholder="Describe the quality of work done…" className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 resize-none focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"/>
            </div>
            <button onClick={handleSaveRating} className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all">
              <ThumbsUp className="w-4 h-4"/> Save Rating
            </button>
          </div>
        </div>
      )}

      {/* ── Payment Modal ── */}
      {payWo && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setPayWo(null)}/>
          <div className="relative z-10 w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Record Fee Payment</h3>
              <button onClick={() => setPayWo(null)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-4 h-4 text-slate-400"/></button>
            </div>
            <p className="text-xs text-slate-500 font-semibold">{payWo.jobNumber} · Outstanding: <span className="text-rose-600 font-extrabold">${payWo.totalCost - payWo.paidAmount}</span></p>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">Amount to Pay ($) *</label>
                <input type="number" value={payAmount} onChange={e=>setPayAmount(Number(e.target.value))} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-extrabold text-emerald-600 font-mono text-base focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"/>
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">Payment Method *</label>
                <select value={payMethod} onChange={e=>setPayMethod(e.target.value as any)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all">
                  <option>Mobile Money</option>
                  <option>Bank Transfer</option>
                  <option>Cash</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">Transaction Reference *</label>
                <input type="text" value={payRef} onChange={e=>setPayRef(e.target.value)} placeholder="e.g. MTN-2026-XXXXX" className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"/>
              </div>
            </div>
            <button onClick={handleRecordPayment} className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all">
              <CreditCard className="w-4 h-4"/> Confirm Payment
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/*  ADD TECHNICIAN DRAWER                                               */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div className={`fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300 ${addDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setAddDrawerOpen(false)}/>
      <aside className={`fixed right-0 top-0 h-full z-50 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out ${addDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 text-brand-600 dark:text-brand-400 font-bold text-xs mb-0.5"><Plus className="w-3.5 h-3.5"/> Register Contractor</div>
            <h2 className="text-lg font-extrabold font-display text-slate-900 dark:text-white">Add New Technician</h2>
          </div>
          <button onClick={() => setAddDrawerOpen(false)} className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"><X className="w-5 h-5"/></button>
        </div>

        <form onSubmit={handleAddTech} className="flex-1 overflow-y-auto px-6 py-5 space-y-4 text-xs">
          {/* Identity & Company */}
          <div className="space-y-3">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Contractor Identity & Company *
            </label>
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">Full Name *</label>
              <input type="text" required value={newName} onChange={e=>setNewName(e.target.value)} placeholder="e.g. Aimable Nkundimana" className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"/>
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">Company / Firm *</label>
              <input type="text" required value={newCompany} onChange={e=>setNewCompany(e.target.value)} placeholder="e.g. Kigali HydroPlumb Solutions" className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">Phone *</label>
                <input type="text" required value={newContact} onChange={e=>setNewContact(e.target.value)} placeholder="+250 788 000 000" className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"/>
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">Email</label>
                <input type="email" value={newEmail} onChange={e=>setNewEmail(e.target.value)} placeholder="name@company.rw" className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"/>
              </div>
            </div>
          </div>

          {/* Trade & Rates */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Trade & Compensation *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">Specialization *</label>
                <select value={newSpec} onChange={e=>setNewSpec(e.target.value as any)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all">
                  {specializations.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">Hourly Rate ($)</label>
                <input type="number" value={newRate} onChange={e=>setNewRate(Number(e.target.value))} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"/>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">Years Experience</label>
                <input type="number" min={0} value={newYears} onChange={e=>setNewYears(Number(e.target.value))} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"/>
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">National ID</label>
                <input type="text" value={newNationalId} onChange={e=>setNewNationalId(e.target.value)} placeholder="16-digit NID" className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"/>
              </div>
            </div>
          </div>

          {/* Payment & Additional Details */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Payout & Additional Details
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">Preferred Payment</label>
                <select value={newPayMethod} onChange={e=>setNewPayMethod(e.target.value as any)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all">
                  <option>Mobile Money</option>
                  <option>Bank Transfer</option>
                  <option>Cash</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">Account / Float No.</label>
                <input type="text" value={newPayAccount} onChange={e=>setNewPayAccount(e.target.value)} placeholder="Account or MoMo number" className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"/>
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">Certifications (comma-separated)</label>
              <input type="text" value={newCerts} onChange={e=>setNewCerts(e.target.value)} placeholder="e.g. Rwanda RURA License, City & Guilds L3" className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"/>
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">Field Notes & Specialties</label>
              <textarea rows={2} value={newNotes} onChange={e=>setNewNotes(e.target.value)} placeholder="Any relevant notes about the technician's skills or availability…" className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white text-xs placeholder:text-slate-400 resize-none focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"/>
            </div>
          </div>

          <div className="pt-2">
            <button type="submit" className="w-full py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2">
              <UserCheck className="w-4 h-4"/> Register Technician
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
};
