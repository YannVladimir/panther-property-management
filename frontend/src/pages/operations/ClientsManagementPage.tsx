import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { useClientsQuery, useUpdateClientStatusMutation } from '../../api/clients';
import {
  Users,
  Search,
  Mail,
  Phone,
  DoorOpen,
  Building,
  Package,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Eye,
  Shield,
  MapPin,
  Calendar,
  ExternalLink,
  ChevronRight,
  Plus,
  FileCheck,
  AlertTriangle,
  UserX,
  UserCheck,
  Ban,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Pagination } from '../../components/common/Pagination';
import { Modal } from '../../components/common/Modal';
import { Client } from '../../types';

export const ClientsManagementPage: React.FC = () => {
  const { payments, damages } = useData();
  const clientsQuery = useClientsQuery();
  const clients = clientsQuery.data ?? [];
  const updateClientStatusMutation = useUpdateClientStatusMutation();
  const { success, info, error } = useToast();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [lifecycleFilter, setLifecycleFilter] = useState<'all' | 'active' | 'former' | 'inactive' | 'suspended'>('all');
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Deactivate / Change Status Modal state
  const [statusModalClient, setStatusModalClient] = useState<Client | null>(null);
  const [newStatus, setNewStatus] = useState<Client['status']>('inactive');
  const [statusReason, setStatusReason] = useState('Lease Agreement Expired / Moved Out');

  const filteredClients = useMemo(() => clients.filter((c) => {
    if (paymentFilter !== 'all' && c.paymentStatus !== paymentFilter) return false;
    if (lifecycleFilter !== 'all' && c.status !== lifecycleFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.currentPropertyName.toLowerCase().includes(q) ||
        c.currentRoomNumber.toLowerCase().includes(q) ||
        c.identificationNumber.toLowerCase().includes(q)
      );
    }
    return true;
  }), [clients, paymentFilter, lifecycleFilter, searchQuery]);

  const pagedClients = useMemo(() => {
    const start = (pageIndex - 1) * pageSize;
    return filteredClients.slice(start, start + pageSize);
  }, [filteredClients, pageIndex, pageSize]);

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusModalClient) return;

    try {
      await updateClientStatusMutation.mutateAsync({
        id: statusModalClient.id,
        status: newStatus,
        reason: statusReason,
      });
      if (newStatus === 'active') {
        success('Client Reactivated', `${statusModalClient.name}'s profile is now Active.`);
      } else {
        info(
          'Status Updated',
          `${statusModalClient.name} is now marked as ${newStatus.toUpperCase()} (${statusReason}).`
        );
      }
      setStatusModalClient(null);
    } catch {
      error('Update Failed', 'Could not update this client’s status. Please try again.');
    }
  };

  const getClientStatusBadge = (status: Client['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="success" size="sm" dot>ACTIVE</Badge>;
      case 'former':
        return <Badge variant="neutral" size="sm" dot>FORMER</Badge>;
      case 'suspended':
        return <Badge variant="danger" size="sm" dot>SUSPENDED</Badge>;
      case 'inactive':
      default:
        return <Badge variant="warning" size="sm" dot>INACTIVE</Badge>;
    }
  };

  if (clientsQuery.isLoading) {
    return <div className="py-24 text-center text-sm text-slate-400">Loading clients…</div>;
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Tenant Directory & Master Records
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 dark:text-white mt-1">
            Clients & Resident Profiles
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage resident dossiers, lease status, activate/deactivate tenants, upload contracts & KYC, and log damages.
          </p>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-2xl border shadow-soft space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase text-slate-400">
            <span>Total Clients</span>
            <Users className="w-4 h-4 text-brand-500" />
          </div>
          <p className="text-2xl font-extrabold font-display text-slate-900 dark:text-white">{clients.length}</p>
        </div>
        <div className="glass-card p-4 rounded-2xl border shadow-soft space-y-1 bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
            <span>Active Residents</span>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold font-display text-emerald-600 dark:text-emerald-400">
            {clients.filter((c) => c.status === 'active').length}
          </p>
        </div>
        <div className="glass-card p-4 rounded-2xl border shadow-soft space-y-1 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase text-slate-500">
            <span>Former / Inactive</span>
            <UserX className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-extrabold font-display text-slate-600 dark:text-slate-300">
            {clients.filter((c) => c.status === 'former' || c.status === 'inactive').length}
          </p>
        </div>
        <div className="glass-card p-4 rounded-2xl border shadow-soft space-y-1 bg-rose-50/30 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase text-rose-600 dark:text-rose-400">
            <span>Suspended / Dispute</span>
            <Ban className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-extrabold font-display text-rose-600 dark:text-rose-400">
            {clients.filter((c) => c.status === 'suspended').length}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 rounded-2xl shadow-soft flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search clients by name, unit #, email, or national ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={lifecycleFilter}
            onChange={(e) => setLifecycleFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
          >
            <option value="all">All Profiles ({clients.length})</option>
            <option value="active">Active Residents ({clients.filter((c) => c.status === 'active').length})</option>
            <option value="former">Former Clients ({clients.filter((c) => c.status === 'former').length})</option>
            <option value="inactive">Inactive ({clients.filter((c) => c.status === 'inactive').length})</option>
            <option value="suspended">Suspended ({clients.filter((c) => c.status === 'suspended').length})</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
          >
            <option value="all">All Payment Statuses</option>
            <option value="paid">Paid & Settled</option>
            <option value="pending">Pending Settlement</option>
            <option value="overdue">Overdue Notice</option>
          </select>
        </div>
      </div>

      {/* Clients Table */}
      <div className="glass-card rounded-3xl shadow-soft overflow-hidden border">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold text-[10px] bg-slate-50/50 dark:bg-slate-800/30">
                <th className="py-3.5 px-6">Tenant Name</th>
                <th className="py-3.5 px-4">Profile Status</th>
                <th className="py-3.5 px-4">Contact Info</th>
                <th className="py-3.5 px-4">Current Suite</th>
                <th className="py-3.5 px-4">Rental Tier</th>
                <th className="py-3.5 px-4">Lease Period</th>
                <th className="py-3.5 px-4">Rent</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    No clients match your filter criteria.
                  </td>
                </tr>
              ) : (
                pagedClients.map((c) => {
                  const clientDamagesCount = damages.filter(
                    (d) => d.clientId === c.id || d.clientName === c.name
                  ).length;

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => navigate(`/operations/clients/${c.id}`)}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={c.avatar}
                            alt={c.name}
                            className="w-10 h-10 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-xs"
                          />
                          <div>
                            <Link
                              to={`/operations/clients/${c.id}`}
                              className="font-bold text-slate-900 dark:text-white hover:text-brand-600 transition-colors text-sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {c.name}
                            </Link>
                            <p className="text-[10px] text-slate-400">
                              {c.nationality} • ID: {c.identificationNumber}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {getClientStatusBadge(c.status)}
                        {c.deactivationReason && (
                          <span className="block text-[9px] text-slate-400 truncate max-w-[130px]" title={c.deactivationReason}>
                            {c.deactivationReason}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-medium text-slate-900 dark:text-white">{c.email}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{c.phone}</p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-extrabold text-brand-600 dark:text-brand-400 font-mono">
                          Unit {c.currentRoomNumber}
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium">{c.currentPropertyName}</p>
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                          {c.rentalType}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-[11px] text-slate-500">
                        <span className="font-medium">{c.moveInDate}</span>
                        <span className="block text-[10px] text-slate-400">to {c.leaseExpiryDate}</span>
                      </td>
                      <td className="py-4 px-4 font-extrabold text-slate-900 dark:text-white font-mono text-sm">
                        ${c.monthlyRent}/mo
                      </td>
                      <td className="py-4 px-4">
                        <Badge
                          variant={
                            c.paymentStatus === 'paid'
                              ? 'success'
                              : c.paymentStatus === 'pending'
                              ? 'warning'
                              : 'danger'
                          }
                          size="sm"
                          dot
                        >
                          {c.paymentStatus.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          {c.status === 'active' ? (
                            <button
                              onClick={() => {
                                setStatusModalClient(c);
                                setNewStatus('former');
                                setStatusReason('Lease Agreement Expired / Checked Out');
                              }}
                              title="Deactivate or mark client as Former/Suspended"
                              className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/60 dark:hover:text-rose-300 text-slate-600 dark:text-slate-400 font-bold text-xs transition-colors inline-flex items-center gap-1 border border-slate-200 dark:border-slate-700"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              <span>Deactivate</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setStatusModalClient(c);
                                setNewStatus('active');
                                setStatusReason('Re-activated by Operations Manager');
                              }}
                              title="Reactivate resident profile"
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 dark:text-emerald-300 font-bold text-xs transition-colors inline-flex items-center gap-1 border border-emerald-200 dark:border-emerald-800"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Reactivate</span>
                            </button>
                          )}

                          <Link
                            to={`/operations/clients/${c.id}`}
                            className="px-3 py-1.5 rounded-xl bg-brand-50 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 hover:bg-brand-100 font-bold text-xs transition-colors inline-flex items-center gap-1 shadow-2xs"
                          >
                            <span>Dossier</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={pageIndex}
          totalItems={filteredClients.length}
          pageSize={pageSize}
          onPageChange={(p) => setPageIndex(p)}
          onPageSizeChange={(s) => { setPageSize(s); setPageIndex(1); }}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MODAL: CHANGE CLIENT STATUS / DEACTIVATE                    */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {statusModalClient && (
        <Modal
          isOpen={Boolean(statusModalClient)}
          onClose={() => setStatusModalClient(null)}
          title={newStatus === 'active' ? 'Reactivate Resident Profile' : 'Deactivate / Change Profile Status'}
          subtitle={`${statusModalClient.name} (Unit ${statusModalClient.currentRoomNumber} — ${statusModalClient.currentPropertyName})`}
        >
          <form onSubmit={handleStatusSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Target Lifecycle Status *
              </label>
              <select
                value={newStatus}
                onChange={(e) => {
                  const val = e.target.value as Client['status'];
                  setNewStatus(val);
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

            {newStatus !== 'active' && (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Important Notice</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Setting this client to <strong>{newStatus.toUpperCase()}</strong> will archive their active residency. Their tenancy history, damage reports, water readings, and invoices will remain intact.
                </p>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                className={`w-full py-3 rounded-xl font-bold text-sm shadow-md transition-all text-white ${
                  newStatus === 'active'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : newStatus === 'suspended'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-brand-600 hover:bg-brand-700'
                }`}
              >
                {newStatus === 'active' ? 'Confirm Profile Reactivation' : `Confirm ${newStatus.toUpperCase()} Status`}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
