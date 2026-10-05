import React, { useState, useMemo, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { useAgentsQuery, useCreateAgentMutation, useAddAgentDealMutation, usePayAgentCommissionMutation } from '../../api/agents';
import { usePropertiesQuery } from '../../api/properties';
import {
  UserCheck,
  Search,
  DollarSign,
  TrendingUp,
  Award,
  Phone,
  Mail,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  X,
  Building,
  DoorOpen,
  Calendar,
  CreditCard,
  Eye,
  FileText,
  Briefcase,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Pagination } from '../../components/common/Pagination';
import { Modal } from '../../components/common/Modal';
import { Agent, AgentDeal } from '../../types';

export const AgentsCommissionsPage: React.FC = () => {
  const agentsQuery = useAgentsQuery();
  const propertiesQuery = usePropertiesQuery();
  const agents = agentsQuery.data ?? [];
  const properties = propertiesQuery.data ?? [];
  const isLoading = agentsQuery.isLoading || propertiesQuery.isLoading;

  const createAgentMutation = useCreateAgentMutation();
  const addAgentDealMutation = useAddAgentDealMutation();
  const payAgentCommissionMutation = usePayAgentCommissionMutation();

  const { success, error, info } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'outstanding' | 'settled'>('all');
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Slide-in Drawer States — only the id is stored; the displayed agent is derived live from
  // `agents` below so it automatically reflects fresh data after any mutation invalidates the
  // agents query, instead of going stale until manually "refreshed".
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const selectedAgent = agents.find((a) => a.id === selectedAgentId) ?? null;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addAgentDrawerOpen, setAddAgentDrawerOpen] = useState(false);

  // Modal States
  const [dealModalOpen, setDealModalOpen] = useState(false);
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState(0);
  const [payoutMethod, setPayoutMethod] = useState<'Bank Transfer' | 'Mobile Money' | 'Cash'>('Bank Transfer');
  const [payoutRef, setPayoutRef] = useState(`REF-${Math.floor(100000 + Math.random() * 900000)}`);

  // New Agent Form State
  const [newName, setNewName] = useState('');
  const [newAgency, setNewAgency] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRate, setNewRate] = useState(10);
  const [newPaymentMethod, setNewPaymentMethod] = useState<'Mobile Money' | 'Bank Transfer' | 'Cash'>('Bank Transfer');
  const [newPayoutAccount, setNewPayoutAccount] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // New Deal Form State
  const [dealAgentId, setDealAgentId] = useState('');
  const [dealClientName, setDealClientName] = useState('');
  const [dealClientEmail, setDealClientEmail] = useState('');
  const [dealPropertyId, setDealPropertyId] = useState('');
  const [dealRoomNumber, setDealRoomNumber] = useState('A-204');
  const [dealMonthlyRent, setDealMonthlyRent] = useState(850);
  const [dealCommissionPct, setDealCommissionPct] = useState(30);
  const [dealStatus, setDealStatus] = useState<'Pending' | 'Paid'>('Pending');
  const [dealNotes, setDealNotes] = useState('');

  useEffect(() => {
    if (!dealPropertyId && properties.length > 0) setDealPropertyId(properties[0].id);
  }, [properties, dealPropertyId]);

  const totalCommissionEarned = agents.reduce((acc, a) => acc + (a.totalCommissionEarned || 0), 0);
  const totalCommissionPaid = agents.reduce((acc, a) => acc + (a.commissionPaid || 0), 0);
  const totalOutstanding = agents.reduce((acc, a) => acc + (a.outstandingCommission || 0), 0);
  const totalDealsCount = agents.reduce((acc, a) => acc + (a.deals?.length || a.successfulRentals || 0), 0);

  const filteredAgents = useMemo(() => agents.filter((a) => {
    if (statusFilter === 'outstanding' && (a.outstandingCommission || 0) <= 0) return false;
    if (statusFilter === 'settled' && (a.outstandingCommission || 0) > 0) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        a.name.toLowerCase().includes(q) ||
        (a.agency || '').toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.phone.includes(q)
      );
    }
    return true;
  }), [agents, statusFilter, searchQuery]);

  const pagedAgents = useMemo(() => {
    const start = (pageIndex - 1) * pageSize;
    return filteredAgents.slice(start, start + pageSize);
  }, [filteredAgents, pageIndex, pageSize]);

  const openAgentDrawer = (agent: Agent) => {
    setSelectedAgentId(agent.id);
    setDrawerOpen(true);
  };

  const closeAgentDrawer = () => {
    setDrawerOpen(false);
    setSelectedAgentId(null);
  };

  const openDealModalForAgent = (agent?: Agent) => {
    const targetAgent = agent || agents[0];
    if (targetAgent) {
      setDealAgentId(targetAgent.id);
      setDealCommissionPct(targetAgent.commissionRatePercent || 30);
    }
    setDealModalOpen(true);
  };

  const openPayoutModalForAgent = (agent: Agent) => {
    setSelectedAgentId(agent.id);
    setPayoutAmount(agent.outstandingCommission);
    setPayoutMethod(agent.paymentMethod || 'Bank Transfer');
    setPayoutRef(`PAY-${Math.floor(100000 + Math.random() * 900000)}`);
    setPayoutModalOpen(true);
  };

  const handleAddAgentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) {
      error('Validation Error', 'Agent name and email are required.');
      return;
    }

    try {
      // No avatar field on the real create endpoint (the mock generated a random stock photo —
      // the backend has no avatar-upload story for agents yet); status defaults to Active server-side.
      const created = await createAgentMutation.mutateAsync({
        name: newName.trim(),
        agency: newAgency.trim() || 'Independent Broker',
        phone: newPhone.trim() || '+250 788 000 000',
        email: newEmail.trim(),
        commissionRatePercent: Number(newRate),
        paymentMethod: newPaymentMethod,
        payoutAccount: newPayoutAccount.trim() || 'Pending payout setup',
        notes: newNotes,
      });

      success('Broker Registered', `Partner ${created.name} registered successfully.`);
      setAddAgentDrawerOpen(false);
      // Reset form
      setNewName('');
      setNewAgency('');
      setNewPhone('');
      setNewEmail('');
      setNewPayoutAccount('');
      setNewNotes('');
    } catch {
      error('Registration Failed', 'Could not register this agent. Please try again.');
    }
  };

  const handleRecordDealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealAgentId) {
      error('Validation Error', 'Please select a referral agent.');
      return;
    }
    if (!dealClientName.trim()) {
      error('Validation Error', 'Tenant/Client name is required.');
      return;
    }

    const targetProp = properties.find((p) => p.id === dealPropertyId) || properties[0];
    if (!targetProp) {
      error('No Property Available', 'Cannot log a deal with no properties in the system.');
      return;
    }

    try {
      // commissionAmount is computed server-side from monthlyRent × commissionPercentage — not
      // sent here. The "Leased Unit / Suite #" field has no real room picker yet (unlike
      // AdminRoomEditPage's building selector), so it isn't sent as a roomId; kept in the form
      // for now as a display-only note rather than removed outright.
      const createdDeal = await addAgentDealMutation.mutateAsync({
        agentId: dealAgentId,
        input: {
          clientName: dealClientName.trim(),
          clientEmail: dealClientEmail.trim() || undefined,
          propertyId: targetProp.id,
          monthlyRent: Number(dealMonthlyRent),
          commissionPercentage: Number(dealCommissionPct),
          notes: dealNotes,
        },
      });

      // New deals always start Pending server-side — "Already Paid" is achieved as a second,
      // real settlement call rather than something the create endpoint accepts directly.
      if (dealStatus === 'Paid') {
        await payAgentCommissionMutation.mutateAsync({
          agentId: dealAgentId,
          amount: createdDeal.commissionAmount,
          paymentMethod: 'Mobile Money',
          reference: `AUTO-SETTLE-${Date.now().toString().slice(-4)}`,
          dealIds: [createdDeal.id],
        });
      }

      const agentObj = agents.find((a) => a.id === dealAgentId);
      success(
        'Deal & Commission Logged',
        `Logged $${createdDeal.commissionAmount} commission deal for ${dealClientName} with ${agentObj?.name}.`
      );

      setDealModalOpen(false);
      // Reset deal form
      setDealClientName('');
      setDealClientEmail('');
      setDealNotes('');
    } catch {
      error('Deal Logging Failed', 'Could not log this deal. Please try again.');
    }
  };

  const handlePayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent || payoutAmount <= 0) return;

    try {
      await payAgentCommissionMutation.mutateAsync({
        agentId: selectedAgent.id,
        amount: Number(payoutAmount),
        paymentMethod: payoutMethod,
        reference: payoutRef,
      });
      success(
        'Commission Disbursed',
        `Disbursed payout of $${payoutAmount} to ${selectedAgent.name} (Ref: ${payoutRef}).`
      );
      setPayoutModalOpen(false);
    } catch {
      error('Payout Failed', 'Could not process this payout. Please try again.');
    }
  };

  if (isLoading) {
    return <div className="py-24 text-center text-sm text-slate-400">Loading agents…</div>;
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 px-2.5 py-1 rounded-full border border-brand-200 dark:border-brand-800 mb-1">
            <Briefcase className="w-3.5 h-3.5" />
            <span>Broker & Referral Network</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 dark:text-white">
            Agents, Brokers & Commissions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage partner real estate agencies, log closed tenancy deals, track commission earnings, and disburse payouts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => openDealModalForAgent()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-xs transition-all"
          >
            <Plus className="w-4 h-4 text-emerald-500" />
            <span>Log Closed Deal</span>
          </button>

          <button
            onClick={() => setAddAgentDrawerOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md hover:shadow-glow transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Agent</span>
          </button>
        </div>
      </div>

      {/* Top Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-card p-5 rounded-3xl border shadow-soft space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Total Earned</span>
            <DollarSign className="w-4 h-4 text-brand-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 dark:text-white">
            ${totalCommissionEarned.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-500 font-medium">Across {totalDealsCount} closed leases</p>
        </div>

        <div className="glass-card p-5 rounded-3xl border shadow-soft space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Commissions Settled</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold font-display text-emerald-600 dark:text-emerald-400">
            ${totalCommissionPaid.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-500 font-medium">Paid via MoMo / Bank Wire</p>
        </div>

        <div className="glass-card p-5 rounded-3xl border shadow-soft space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Outstanding Balance</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold font-display text-amber-500">
            ${totalOutstanding.toLocaleString()}
          </p>
          <p className="text-[11px] text-amber-600 font-semibold">Ready for disbursement</p>
        </div>

        <div className="glass-card p-5 rounded-3xl border shadow-soft space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Partner Network</span>
            <UserCheck className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold font-display text-purple-600 dark:text-purple-400">
            {agents.length} Brokers
          </p>
          <p className="text-[11px] text-slate-500 font-medium">Active leasing agencies</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 rounded-2xl shadow-soft flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search brokers by name, agency, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500'
            }`}
          >
            All Partners ({agents.length})
          </button>
          <button
            onClick={() => setStatusFilter('outstanding')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'outstanding'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-amber-600 dark:text-amber-400'
            }`}
          >
            Has Outstanding Payouts
          </button>
          <button
            onClick={() => setStatusFilter('settled')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'settled'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-500'
            }`}
          >
            Fully Settled
          </button>
        </div>
      </div>

      {/* Agents Master Ledger Table */}
      <div className="glass-card rounded-3xl shadow-soft overflow-hidden border">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold text-[10px] bg-slate-50/50 dark:bg-slate-800/30">
                <th className="py-3.5 px-6">Agent & Agency</th>
                <th className="py-3.5 px-4">Contact Info</th>
                <th className="py-3.5 px-4">Referrals & Closed Deals</th>
                <th className="py-3.5 px-4">Comm. Rate</th>
                <th className="py-3.5 px-4">Total Earned</th>
                <th className="py-3.5 px-4">Paid</th>
                <th className="py-3.5 px-4">Outstanding Payout</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredAgents.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <UserCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="font-semibold">No brokers match your query.</p>
                  </td>
                </tr>
              )}
              {pagedAgents.map((a) => {
                const dealsCount = a.deals?.length || a.successfulRentals || 0;

                return (
                  <tr
                    key={a.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => openAgentDrawer(a)}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={a.avatar}
                          alt={a.name}
                          className="w-10 h-10 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-xs shrink-0"
                        />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-sm hover:text-brand-600 transition-colors">
                            {a.name}
                          </p>
                          <p className="text-[10px] text-slate-500 font-medium">{a.agency || 'Independent Partner'}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <p className="font-medium text-slate-800 dark:text-slate-200">{a.email}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{a.phone}</p>
                    </td>

                    <td className="py-4 px-4">
                      <span className="font-bold text-brand-600 dark:text-brand-400">{dealsCount} Deals Closed</span>
                      <p className="text-[10px] text-slate-400">{a.clientsReferred} Leads Referred</p>
                    </td>

                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-extrabold font-mono text-[11px] text-slate-800 dark:text-slate-200">
                        {a.commissionRatePercent}%
                      </span>
                    </td>

                    <td className="py-4 px-4 font-bold text-slate-900 dark:text-white font-mono text-sm">
                      ${a.totalCommissionEarned}
                    </td>

                    <td className="py-4 px-4 font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                      ${a.commissionPaid}
                    </td>

                    <td className="py-4 px-4">
                      {a.outstandingCommission > 0 ? (
                        <span className="font-extrabold text-amber-500 font-mono text-sm">
                          ${a.outstandingCommission}
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-bold text-xs flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Settled</span>
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-6 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openAgentDrawer(a);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 hover:text-brand-600 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Deals ({dealsCount})</span>
                      </button>

                      {a.outstandingCommission > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openPayoutModalForAgent(a);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all inline-flex items-center gap-1"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Disburse</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={pageIndex}
          totalItems={filteredAgents.length}
          pageSize={pageSize}
          onPageChange={(p) => setPageIndex(p)}
          onPageSizeChange={(s) => { setPageSize(s); setPageIndex(1); }}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 1. SLIDE-IN SIDEBAR PANEL: AGENT PROFILE & DEALS LEDGER     */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div
        className={`fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300 ${
          drawerOpen && selectedAgent ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeAgentDrawer}
      />

      <aside
        className={`fixed right-0 top-0 h-full z-50 w-full max-w-2xl bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out ${
          drawerOpen && selectedAgent ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {selectedAgent && (
          <>
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img
                  src={selectedAgent.avatar}
                  alt={selectedAgent.name}
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-brand-500 shadow-md shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-extrabold font-display text-slate-900 dark:text-white">
                      {selectedAgent.name}
                    </h2>
                    <Badge variant="success" size="sm">
                      {selectedAgent.status.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    {selectedAgent.agency || 'Independent Real Estate Partner'}
                  </p>
                </div>
              </div>

              <button
                onClick={closeAgentDrawer}
                className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 text-xs text-slate-700 dark:text-slate-300">
              {/* Financial Snapshot */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Total Earned</span>
                  <p className="text-lg font-extrabold text-slate-900 dark:text-white font-mono">
                    ${selectedAgent.totalCommissionEarned}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-1">
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold uppercase">Settled Paid</span>
                  <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                    ${selectedAgent.commissionPaid}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center space-y-1">
                  <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold uppercase">Outstanding</span>
                  <p className="text-lg font-extrabold text-amber-600 font-mono">
                    ${selectedAgent.outstandingCommission}
                  </p>
                </div>
              </div>

              {/* Contact & Payout Details */}
              <div className="glass-card p-5 rounded-2xl border space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Broker Payout & Contact Details
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-slate-400 font-semibold text-[10px] uppercase">Email Address</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{selectedAgent.email}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold text-[10px] uppercase">Phone Number</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 font-mono mt-0.5">{selectedAgent.phone}</p>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 font-semibold text-[10px] uppercase">Default Payout Channel</span>
                    <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                      {selectedAgent.payoutAccount || 'Bank Swift / MTN Mobile Money (Verified)'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Closed Deals & Commission Ledger */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Closed Deals & Commission Records ({selectedAgent.deals?.length || 0})
                  </h3>

                  <button
                    onClick={() => openDealModalForAgent(selectedAgent)}
                    className="px-3 py-1.5 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 hover:bg-brand-100 font-bold text-xs transition-colors inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Log New Deal</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {(!selectedAgent.deals || selectedAgent.deals.length === 0) ? (
                    <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border text-center text-slate-400">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="font-semibold">No closed deals recorded yet for this broker.</p>
                    </div>
                  ) : (
                    selectedAgent.deals.map((deal) => (
                      <div
                        key={deal.id}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2 hover:border-brand-500 transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-white text-sm">
                                {deal.clientName}
                              </span>
                              <Badge variant={deal.status === 'Paid' ? 'success' : 'warning'} size="sm">
                                {deal.status.toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {deal.propertyName} • {deal.roomNumber ? `Unit ${deal.roomNumber}` : 'Apartment'} • {deal.date}
                            </p>
                          </div>

                          <div className="text-right">
                            <span className="font-extrabold text-brand-600 dark:text-brand-400 font-mono text-base">
                              ${deal.commissionAmount}
                            </span>
                            <p className="text-[10px] text-slate-400 font-medium">
                              {deal.commissionPercentage}% of ${deal.monthlyRent} rent
                            </p>
                          </div>
                        </div>

                        {deal.status === 'Paid' ? (
                          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[10px] text-slate-500">
                            <span>Paid on: <strong className="text-slate-700 dark:text-slate-300">{deal.payoutDate || deal.date}</strong></span>
                            <span className="font-mono">{deal.payoutReference || 'SETTLED'}</span>
                          </div>
                        ) : (
                          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[10px]">
                            <span className="text-amber-600 font-semibold">Pending disbursement approval</span>
                            <button
                              onClick={async () => {
                                try {
                                  await payAgentCommissionMutation.mutateAsync({
                                    agentId: selectedAgent.id,
                                    amount: deal.commissionAmount,
                                    paymentMethod: 'Mobile Money',
                                    reference: `MOMO-${Date.now().toString().slice(-4)}`,
                                    dealIds: [deal.id],
                                  });
                                  success('Deal Commission Settled', `Marked $${deal.commissionAmount} commission for ${deal.clientName} as Paid.`);
                                } catch {
                                  error('Settlement Failed', 'Could not settle this commission. Please try again.');
                                }
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors"
                            >
                              Settle ${deal.commissionAmount} Now
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between gap-3">
              {selectedAgent.outstandingCommission > 0 ? (
                <button
                  onClick={() => openPayoutModalForAgent(selectedAgent)}
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Disburse Full Outstanding (${selectedAgent.outstandingCommission})</span>
                </button>
              ) : (
                <div className="w-full text-center py-1.5 text-emerald-600 font-bold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>All Commissions are Up-to-Date & Settled</span>
                </div>
              )}
            </div>
          </>
        )}
      </aside>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 2. SLIDE-IN SIDEBAR PANEL: ADD NEW AGENT / BROKER           */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div
        className={`fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300 ${
          addAgentDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setAddAgentDrawerOpen(false)}
      />

      <aside
        className={`fixed right-0 top-0 h-full z-50 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out ${
          addAgentDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 text-brand-600 dark:text-brand-400 font-bold text-xs mb-0.5">
              <Plus className="w-3.5 h-3.5" />
              <span>Broker Partner Registration</span>
            </div>
            <h2 className="text-lg font-extrabold font-display text-slate-900 dark:text-white">
              Register New Agent / Broker
            </h2>
          </div>
          <button
            onClick={() => setAddAgentDrawerOpen(false)}
            className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleAddAgentSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-4 text-xs">
          {/* Agent Identity & Firm */}
          <div className="space-y-3">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Agent Identity & Brokerage *
            </label>
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Broker / Agent Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Cedric Mugisha"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Real Estate Agency / Brokerage Firm
              </label>
              <input
                type="text"
                placeholder="e.g. Rwanda Prestige Living Ltd"
                value={newAgency}
                onChange={(e) => setNewAgency(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+250 788 000 000"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="agent@brokerage.rw"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Commission & Payout Preferences */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Commission Terms & Account *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">
                  Default Comm. Rate (%) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={100}
                  value={newRate}
                  onChange={(e) => setNewRate(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-brand-600 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">
                  Preferred Payout
                </label>
                <select
                  value={newPaymentMethod}
                  onChange={(e) => setNewPaymentMethod(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                >
                  <option value="Bank Transfer">Bank Swift Wire</option>
                  <option value="Mobile Money">MTN Mobile Money</option>
                  <option value="Cash">Cash Settlement</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Payout Bank / MoMo Account Details
              </label>
              <input
                type="text"
                placeholder="e.g. Bank of Kigali Acc: 00045-8891230-14 or +250 788..."
                value={newPayoutAccount}
                onChange={(e) => setNewPayoutAccount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-medium text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">
              Internal Partnership Notes
            </label>
            <textarea
              rows={3}
              placeholder="Special commission agreements, focus property areas..."
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border leading-relaxed"
            />
          </div>

          <div className="pt-3">
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              <span>Register Partner Broker</span>
            </button>
          </div>
        </form>
      </aside>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 3. MODAL: LOG NEW DEAL & COMMISSION RECORD                  */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {dealModalOpen && (
        <Modal
          isOpen={dealModalOpen}
          onClose={() => setDealModalOpen(false)}
          title="Log Closed Tenancy Deal & Commission"
          subtitle="Record closed lease by partner broker and calculate payout"
        >
          <form onSubmit={handleRecordDealSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Referring Broker / Agent *
              </label>
              <select
                value={dealAgentId}
                onChange={(e) => {
                  setDealAgentId(e.target.value);
                  const ag = agents.find((a) => a.id === e.target.value);
                  if (ag) setDealCommissionPct(ag.commissionRatePercent || 30);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              >
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.agency || 'Broker'}) — Rate: {a.commissionRatePercent}%
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">
                  Tenant / Client Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Arthur Rutayisire"
                  value={dealClientName}
                  onChange={(e) => setDealClientName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">
                  Client Email
                </label>
                <input
                  type="email"
                  placeholder="client@organization.rw"
                  value={dealClientEmail}
                  onChange={(e) => setDealClientEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">
                  Leased Estate Property *
                </label>
                <select
                  value={dealPropertyId}
                  onChange={(e) => setDealPropertyId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">
                  Leased Unit / Suite #
                </label>
                <input
                  type="text"
                  placeholder="e.g. A-301"
                  value={dealRoomNumber}
                  onChange={(e) => setDealRoomNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">
                  Monthly Rent ($) *
                </label>
                <input
                  type="number"
                  required
                  value={dealMonthlyRent}
                  onChange={(e) => setDealMonthlyRent(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">
                  Comm. Rate (%) *
                </label>
                <input
                  type="number"
                  required
                  value={dealCommissionPct}
                  onChange={(e) => setDealCommissionPct(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-brand-600 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">
                  Calculated Comm. ($)
                </label>
                <div className="px-3.5 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 font-extrabold text-emerald-600 text-xs font-mono flex items-center">
                  ${Math.round((Number(dealMonthlyRent) * Number(dealCommissionPct)) / 100)}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Payout Status
              </label>
              <select
                value={dealStatus}
                onChange={(e) => setDealStatus(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              >
                <option value="Pending">Pending (Add to Outstanding Payouts)</option>
                <option value="Paid">Already Paid & Settled</option>
              </select>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md transition-all"
              >
                Save Deal & Register Commission
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 4. MODAL: DISBURSE COMMISSION PAYOUT                        */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {selectedAgent && payoutModalOpen && (
        <Modal
          isOpen={payoutModalOpen}
          onClose={() => setPayoutModalOpen(false)}
          title={`Disburse Commission Payout to ${selectedAgent.name}`}
          subtitle={`Outstanding balance: $${selectedAgent.outstandingCommission}`}
        >
          <form onSubmit={handlePayoutSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">
                  Payout Amount ($ USD) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={selectedAgent.outstandingCommission}
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-extrabold text-emerald-600 font-mono text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">
                  Payment Channel
                </label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                >
                  <option value="Bank Transfer">Bank Swift Transfer (Bank of Kigali)</option>
                  <option value="Mobile Money">MTN Mobile Money Float</option>
                  <option value="Cash">Cash Voucher Settlement</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Transaction Reference / Bank Swift # *
              </label>
              <input
                type="text"
                required
                value={payoutRef}
                onChange={(e) => setPayoutRef(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-500 text-[11px]">
              <span>Destination Account: </span>
              <strong className="text-slate-800 dark:text-slate-200">
                {selectedAgent.payoutAccount || 'Bank Swift / MTN Mobile Money (Verified)'}
              </strong>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Confirm & Disburse Payout</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
