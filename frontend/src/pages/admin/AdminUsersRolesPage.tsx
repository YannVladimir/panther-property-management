import React, { useState, useMemo } from 'react';
import { useToast } from '../../context/ToastContext';
import { ApiError } from '../../api/client';
import {
  AdminUser,
  UserInput,
  useUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useUpdateUserStatusMutation,
  useResetUserPasswordMutation,
  useResendInviteMutation,
  useDeleteUserMutation,
} from '../../api/users';
import { useClientsQuery } from '../../api/clients';
import { useEmployeesQuery } from '../../api/employees';
import {
  Users,
  Shield,
  Search,
  Plus,
  X,
  Key,
  CheckCircle2,
  XCircle,
  Edit3,
  Mail,
  Phone,
  Lock,
  Unlock,
  Trash2,
  UserCheck,
  ShieldAlert,
  UserCog,
  Sparkles,
  MoreVertical,
  EyeOff,
  Send,
  RefreshCw,
  ChevronDown,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Pagination } from '../../components/common/Pagination';
import { UserRole } from '../../types';

/* ── Types ── */
type SystemUser = AdminUser;

/* ── Role config ── */
const ROLE_OPTIONS: { value: UserRole; label: string; color: string; icon: string }[] = [
  { value: 'admin', label: 'System Administrator', color: 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950 dark:text-rose-300', icon: '🔐' },
  { value: 'owner', label: 'Property Owner (BI)', color: 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-950 dark:text-purple-300', icon: '👑' },
  { value: 'operations', label: 'Operations Manager', color: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300', icon: '⚙️' },
  { value: 'household', label: 'Household Staff', color: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300', icon: '🧹' },
  { value: 'client', label: 'Tenant / Resident', color: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300', icon: '🏠' },
];

const getRoleBadgeVariant = (role: UserRole) => {
  const map: Record<UserRole, any> = {
    admin: 'danger', owner: 'purple', operations: 'info', household: 'warning', client: 'success', public: 'info',
  };
  return map[role] ?? 'info';
};

/* ── Empty form ── */
const emptyUser = (): Partial<SystemUser> => ({
  name: '', email: '', phone: '', role: 'operations', status: 'active', title: '',
});

/* ══════════════════════════════════ COMPONENT ══════════════════════════════════ */
export const AdminUsersRolesPage: React.FC = () => {
  const { success, error, info } = useToast();

  const usersQuery = useUsersQuery();
  const users = usersQuery.data ?? [];
  const clientsQuery = useClientsQuery();
  const employeesQuery = useEmployeesQuery();
  const createUserMutation = useCreateUserMutation();
  const updateUserMutation = useUpdateUserMutation();
  const updateStatusMutation = useUpdateUserStatusMutation();
  const resetPasswordMutation = useResetUserPasswordMutation();
  const resendInviteMutation = useResendInviteMutation();
  const deleteUserMutation = useDeleteUserMutation();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<SystemUser>>(emptyUser());
  const [isCreating, setIsCreating] = useState(true);

  /* ── Action dropdown ── */
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  /* ── Confirm dialog ── */
  const [confirmAction, setConfirmAction] = useState<{ type: string; user: SystemUser } | null>(null);

  /* ─ helpers ─ */
  const openCreate = () => {
    setEditingUser(emptyUser());
    setIsCreating(true);
    setPanelOpen(true);
  };

  const openEdit = (u: SystemUser) => {
    setEditingUser({ ...u });
    setIsCreating(false);
    setPanelOpen(true);
    setOpenDropdownId(null);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setTimeout(() => setEditingUser(emptyUser()), 300);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser.name?.trim() || !editingUser.email?.trim()) {
      error('Validation Error', 'Name and email are required.');
      return;
    }

    const input: UserInput = {
      name: editingUser.name!,
      email: editingUser.email!,
      phone: editingUser.phone || undefined,
      role: editingUser.role || 'operations',
      title: editingUser.title || undefined,
      clientId: editingUser.role === 'client' ? editingUser.clientId : undefined,
      employeeId: editingUser.role === 'household' || editingUser.role === 'operations' ? editingUser.employeeId : undefined,
    };

    try {
      if (isCreating) {
        await createUserMutation.mutateAsync(input);
        success('User Created', `Account for "${input.name}" created. An invitation email has been sent.`);
      } else {
        await updateUserMutation.mutateAsync({ id: editingUser.id!, input });
        // Status isn't part of UpdateUserRequest at all — it's a dedicated endpoint. Editing the
        // status dropdown in this same panel would otherwise silently no-op on save.
        const original = users.find((x) => x.id === editingUser.id);
        if (original && editingUser.status && editingUser.status !== original.status) {
          await updateStatusMutation.mutateAsync({ id: editingUser.id!, status: editingUser.status });
        }
        success('User Updated', `Profile for "${input.name}" has been saved.`);
      }
      closePanel();
    } catch (err) {
      error('Save Failed', err instanceof ApiError ? err.message : 'Could not save this user.');
    }
  };

  /* ── User actions ── */
  const handleDeactivate = async (u: SystemUser) => {
    try {
      await updateStatusMutation.mutateAsync({ id: u.id, status: 'inactive' });
      success('User Deactivated', `${u.name} can no longer log in.`);
    } catch (err) {
      error('Action Failed', err instanceof ApiError ? err.message : 'Could not deactivate this user.');
    }
    setConfirmAction(null);
    setOpenDropdownId(null);
  };

  const handleActivate = async (u: SystemUser) => {
    try {
      await updateStatusMutation.mutateAsync({ id: u.id, status: 'active' });
      success('User Activated', `${u.name} can now log in.`);
    } catch (err) {
      error('Action Failed', err instanceof ApiError ? err.message : 'Could not activate this user.');
    }
    setOpenDropdownId(null);
  };

  const handleSuspend = async (u: SystemUser) => {
    try {
      await updateStatusMutation.mutateAsync({ id: u.id, status: 'suspended' });
      success('User Suspended', `${u.name} has been suspended pending review.`);
    } catch (err) {
      error('Action Failed', err instanceof ApiError ? err.message : 'Could not suspend this user.');
    }
    setConfirmAction(null);
    setOpenDropdownId(null);
  };

  const handleResetPassword = async (u: SystemUser) => {
    try {
      await resetPasswordMutation.mutateAsync(u.id);
      info('Password Reset Sent', `A password reset link has been sent to ${u.email}.`);
    } catch (err) {
      error('Action Failed', err instanceof ApiError ? err.message : 'Could not send the reset link.');
    }
    setOpenDropdownId(null);
  };

  const handleResendInvite = async (u: SystemUser) => {
    try {
      await resendInviteMutation.mutateAsync(u.id);
      info('Invitation Sent', `Invitation email resent to ${u.email}.`);
    } catch (err) {
      error('Action Failed', err instanceof ApiError ? err.message : 'Could not resend the invite.');
    }
    setOpenDropdownId(null);
  };

  const handleDelete = async (u: SystemUser) => {
    try {
      await deleteUserMutation.mutateAsync(u.id);
      success('User Deleted', `Account for ${u.name} permanently removed.`);
    } catch (err) {
      error('Action Failed', err instanceof ApiError ? err.message : 'Could not delete this user.');
    }
    setConfirmAction(null);
    setOpenDropdownId(null);
  };

  /* ── Filtered list ── */
  const filtered = useMemo(() => users.filter((u) => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.phone || '').includes(q);
    const matchRole = filterRole === 'all' || u.role === filterRole;
    const matchStatus = filterStatus === 'all' || u.status === filterStatus;
    return matchSearch && matchRole && matchStatus;
  }), [users, searchQuery, filterRole, filterStatus]);

  const pagedUsers = useMemo(() => {
    const start = (pageIndex - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, pageIndex, pageSize]);

  const statusColor = (s: SystemUser['status']) => ({
    active: 'text-emerald-600 dark:text-emerald-400',
    inactive: 'text-slate-400',
    suspended: 'text-rose-600 dark:text-rose-400',
  }[s]);

  const statusIcon = (s: SystemUser['status']) => ({
    active: <CheckCircle2 className="w-3.5 h-3.5" />,
    inactive: <XCircle className="w-3.5 h-3.5" />,
    suspended: <ShieldAlert className="w-3.5 h-3.5" />,
  }[s]);

  /* ── Stats ── */
  const stats = [
    { label: 'Total Accounts', value: users.length, icon: Users, color: 'text-brand-600' },
    { label: 'Active', value: users.filter(u => u.status === 'active').length, icon: CheckCircle2, color: 'text-emerald-600' },
    { label: 'Inactive', value: users.filter(u => u.status === 'inactive').length, icon: XCircle, color: 'text-slate-400' },
    { label: 'Suspended', value: users.filter(u => u.status === 'suspended').length, icon: ShieldAlert, color: 'text-rose-600' },
  ];

  if (usersQuery.isLoading) {
    return <div className="py-24 text-center text-sm text-slate-400">Loading users…</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 px-2.5 py-1 rounded-full border border-brand-200 dark:border-brand-800 mb-1">
            <Shield className="w-3.5 h-3.5" />
            <span>Access Control & RBAC</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 dark:text-white">
            Users, Roles & Permissions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage system accounts, assign role privileges, reset credentials, and control access.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md hover:shadow-glow transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New User</span>
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="glass-card p-4 rounded-2xl border shadow-soft flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 ${s.color}`}>
              <s.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{s.value}</p>
              <p className="text-[11px] text-slate-500 font-semibold">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="glass-card p-4 rounded-2xl shadow-soft flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold sm:w-52"
        >
          <option value="all">All Roles</option>
          {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.icon} {r.label}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold sm:w-40"
        >
          <option value="all">All Statuses</option>
          <option value="active">✅ Active</option>
          <option value="inactive">⚫ Inactive</option>
          <option value="suspended">🚫 Suspended</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="glass-card rounded-3xl shadow-soft overflow-hidden border">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
            System Accounts ({filtered.length})
          </h3>
          <span className="text-xs text-slate-400">{users.length} total accounts</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold text-[10px] bg-slate-50/50 dark:bg-slate-800/30">
                <th className="py-3.5 px-6">User</th>
                <th className="py-3.5 px-4">Email / Contact</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Last Login</th>
                <th className="py-3.5 px-4">Member Since</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="font-semibold">No users match your filters.</p>
                  </td>
                </tr>
              )}
              {pagedUsers.map((u) => (
                <tr key={u.id} className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${u.status === 'suspended' ? 'opacity-60' : ''}`}>
                  {/* Avatar + Name */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700"
                        />
                        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${
                          u.status === 'active' ? 'bg-emerald-500' : u.status === 'suspended' ? 'bg-rose-500' : 'bg-slate-400'
                        }`} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{u.name}</p>
                        <p className="text-[10px] text-slate-400">{u.title || '—'}</p>
                      </div>
                    </div>
                  </td>

                  {/* Email / Phone */}
                  <td className="py-4 px-4">
                    <p className="font-medium text-slate-800 dark:text-slate-200">{u.email}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{u.phone || '—'}</p>
                  </td>

                  {/* Role */}
                  <td className="py-4 px-4">
                    <Badge variant={getRoleBadgeVariant(u.role)} size="sm">
                      {u.role.toUpperCase()}
                    </Badge>
                  </td>

                  {/* Status */}
                  <td className="py-4 px-4">
                    <span className={`flex items-center gap-1.5 font-bold capitalize ${statusColor(u.status)}`}>
                      {statusIcon(u.status)}
                      {u.status}
                    </span>
                  </td>

                  {/* Last Login */}
                  <td className="py-4 px-4 text-slate-500">{u.lastLogin || '—'}</td>

                  {/* Created At */}
                  <td className="py-4 px-4 text-slate-500">{u.createdAt || '—'}</td>

                  {/* Actions Dropdown */}
                  <td className="py-4 px-6 text-right">
                    <div className="relative inline-block">
                      <button
                        onClick={() => setOpenDropdownId(openDropdownId === u.id ? null : u.id)}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {openDropdownId === u.id && (
                        <>
                          {/* Backdrop */}
                          <div className="fixed inset-0 z-10" onClick={() => setOpenDropdownId(null)} />

                          {/* Dropdown Menu */}
                          <div className="absolute right-0 top-10 z-20 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
                            <div className="p-2 space-y-0.5">
                              {/* Edit */}
                              <button
                                onClick={() => openEdit(u)}
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-brand-500" />
                                Edit Profile & Role
                              </button>

                              {/* Reset Password */}
                              <button
                                onClick={() => handleResetPassword(u)}
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                              >
                                <Key className="w-3.5 h-3.5 text-amber-500" />
                                Send Password Reset
                              </button>

                              {/* Resend Invite */}
                              <button
                                onClick={() => handleResendInvite(u)}
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                              >
                                <Send className="w-3.5 h-3.5 text-sky-500" />
                                Resend Invite Email
                              </button>

                              <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

                              {/* Activate / Deactivate */}
                              {u.status === 'active' ? (
                                <button
                                  onClick={() => setConfirmAction({ type: 'deactivate', user: u })}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-700 dark:hover:text-amber-400 transition-colors text-left"
                                >
                                  <EyeOff className="w-3.5 h-3.5 text-amber-500" />
                                  Deactivate Access
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleActivate(u)}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors text-left"
                                >
                                  <Unlock className="w-3.5 h-3.5 text-emerald-500" />
                                  Reactivate Access
                                </button>
                              )}

                              {/* Suspend */}
                              {u.status !== 'suspended' && (
                                <button
                                  onClick={() => setConfirmAction({ type: 'suspend', user: u })}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-colors text-left"
                                >
                                  <Lock className="w-3.5 h-3.5" />
                                  Suspend Account
                                </button>
                              )}

                              <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

                              {/* Delete */}
                              <button
                                onClick={() => setConfirmAction({ type: 'delete', user: u })}
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete Permanently
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={pageIndex}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={(p) => setPageIndex(p)}
          onPageSizeChange={(s) => { setPageSize(s); setPageIndex(1); }}
        />
      </div>

      {/* ══════════ SIDE PANEL ══════════ */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-sm transition-opacity duration-300 ${panelOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={closePanel}
      />

      {/* Panel */}
      <aside
        className={`fixed right-0 top-0 h-full z-40 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out ${panelOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div>
            <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 mb-0.5">
              {isCreating ? <Plus className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
              <span className="text-xs font-bold uppercase tracking-wider">{isCreating ? 'New Account' : 'Edit Account'}</span>
            </div>
            <h2 className="text-lg font-extrabold font-display text-slate-900 dark:text-white">
              {isCreating ? 'Create User Account' : editingUser.name || 'Edit User'}
            </h2>
          </div>
          <button
            onClick={closePanel}
            className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Panel Form */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {/* Avatar preview (edit mode) */}
          {!isCreating && editingUser.avatar && (
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <img src={editingUser.avatar} alt="avatar" className="w-14 h-14 rounded-full object-cover border-2 border-brand-300" />
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-sm">{editingUser.name}</p>
                <p className="text-xs text-slate-500">{editingUser.email}</p>
                <span className={`text-[10px] font-bold capitalize mt-1 inline-block ${statusColor(editingUser.status as any)}`}>
                  ● {editingUser.status}
                </span>
              </div>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-[10px] text-slate-400 font-bold mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={editingUser.name || ''}
              onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
              placeholder="e.g. Jean-Paul Ndahiro"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
            />
          </div>

          {/* Job Title */}
          <div>
            <label className="block text-[10px] text-slate-400 font-bold mb-1">
              Job Title / Designation
            </label>
            <input
              type="text"
              value={editingUser.title || ''}
              onChange={(e) => setEditingUser({ ...editingUser, title: e.target.value })}
              placeholder="e.g. Senior Operations Manager"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-[10px] text-slate-400 font-bold mb-1">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={editingUser.email || ''}
                onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                placeholder="user@example.com"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>
            {isCreating && <p className="text-[10px] text-slate-400 mt-1">An invite email with login credentials will be sent to this address.</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-[10px] text-slate-400 font-bold mb-1">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="tel"
                value={editingUser.phone || ''}
                onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                placeholder="+250 788 000 000"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              System Role & Access Level *
            </label>
            <div className="space-y-2">
              {ROLE_OPTIONS.map((r) => (
                <label
                  key={r.value}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    editingUser.role === r.value
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={r.value}
                    checked={editingUser.role === r.value}
                    onChange={() => setEditingUser({ ...editingUser, role: r.value })}
                    className="text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-lg leading-none">{r.icon}</span>
                  <div>
                    <p className="font-bold text-xs text-slate-900 dark:text-white">{r.label}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 capitalize">{r.value} portal access</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Linked Record — the backend links a CLIENT-role account to its leasing.Client record,
              and a HOUSEHOLD/OPERATIONS-role account to its hr.Employee record. Previously this
              relationship had no picker at all in the UI. */}
          {editingUser.role === 'client' && (
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Linked Client Record
              </label>
              <select
                value={editingUser.clientId || ''}
                onChange={(e) => setEditingUser({ ...editingUser, clientId: e.target.value || undefined })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              >
                <option value="">— No linked client —</option>
                {(clientsQuery.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                ))}
              </select>
            </div>
          )}
          {(editingUser.role === 'household' || editingUser.role === 'operations') && (
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Linked Employee Record
              </label>
              <select
                value={editingUser.employeeId || ''}
                onChange={(e) => setEditingUser({ ...editingUser, employeeId: e.target.value || undefined })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              >
                <option value="">— No linked employee —</option>
                {(employeesQuery.data ?? []).map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.name} ({emp.position})</option>
                ))}
              </select>
            </div>
          )}

          {/* Account Status (edit only) */}
          {!isCreating && (
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Account Status
              </label>
              <select
                value={editingUser.status || 'active'}
                onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as any })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              >
                <option value="active">✅ Active — Can log in</option>
                <option value="inactive">⚫ Inactive — Login disabled</option>
                <option value="suspended">🚫 Suspended — Pending review</option>
              </select>
            </div>
          )}

          {/* Initial Password (create only) */}
          {isCreating && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 mb-1">
                <Key className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Credentials</span>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                A secure temporary password will be auto-generated and emailed to the user. They must change it on first login.
              </p>
            </div>
          )}
        </form>

        {/* Panel Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-3">
          <button
            type="button"
            onClick={closePanel}
            className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
          >
            {isCreating ? (
              <>
                <Send className="w-3.5 h-3.5" />
                Create & Send Invite
              </>
            ) : (
              <>
                <UserCheck className="w-3.5 h-3.5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </aside>

      {/* ══════════ CONFIRM DIALOG ══════════ */}
      {confirmAction && (
        <>
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setConfirmAction(null)}>
            <div
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-sm w-full p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${
                confirmAction.type === 'delete' ? 'bg-rose-100 dark:bg-rose-950' : 'bg-amber-100 dark:bg-amber-950'
              }`}>
                {confirmAction.type === 'delete' ? (
                  <Trash2 className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                ) : confirmAction.type === 'suspend' ? (
                  <Lock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                ) : (
                  <EyeOff className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                )}
              </div>

              <div className="text-center">
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                  {confirmAction.type === 'delete' ? 'Delete Account?' :
                   confirmAction.type === 'suspend' ? 'Suspend Account?' : 'Deactivate Access?'}
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  {confirmAction.type === 'delete'
                    ? `This will permanently delete ${confirmAction.user.name}'s account and all associated data. This cannot be undone.`
                    : confirmAction.type === 'suspend'
                    ? `${confirmAction.user.name} will be suspended and unable to log in pending admin review.`
                    : `${confirmAction.user.name} will be deactivated and lose login access immediately.`}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmAction(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (confirmAction.type === 'delete') handleDelete(confirmAction.user);
                    else if (confirmAction.type === 'suspend') handleSuspend(confirmAction.user);
                    else handleDeactivate(confirmAction.user);
                  }}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs text-white transition-colors ${
                    confirmAction.type === 'delete' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  {confirmAction.type === 'delete' ? 'Yes, Delete' :
                   confirmAction.type === 'suspend' ? 'Yes, Suspend' : 'Yes, Deactivate'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
