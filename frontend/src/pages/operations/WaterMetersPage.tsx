import React, { useState, useMemo } from 'react';
import { useToast } from '../../context/ToastContext';
import {
  Droplets,
  Search,
  Plus,
  TrendingUp,
  DollarSign,
  Building,
  CheckCircle2,
  Clock,
  Edit,
  History,
  CreditCard,
  User,
  ShieldCheck,
  Check,
  X,
  AlertTriangle,
  ArrowUpDown,
  FileText,
  Calendar,
  Sparkles,
  Layers,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Pagination } from '../../components/common/Pagination';
import { Modal } from '../../components/common/Modal';
import { WaterConsumptionTrend } from '../../components/charts/WaterConsumptionTrend';
import { WaterMeterRecord, Client, PaymentMethod } from '../../types';
import { useClientsQuery } from '../../api/clients';
import {
  useWaterMetersQuery,
  useUpdateWaterMeterReadingMutation,
  useRecordWaterMeterPaymentMutation,
  useAssignWaterMeterMutation,
} from '../../api/waterMeters';

interface ClientWithMeter {
  client: Client;
  meter?: WaterMeterRecord;
}

export const WaterMetersPage: React.FC = () => {
  const clientsQuery = useClientsQuery();
  const waterMetersQuery = useWaterMetersQuery();
  const updateReadingMutation = useUpdateWaterMeterReadingMutation();
  const recordPaymentMutation = useRecordWaterMeterPaymentMutation();
  const assignMeterMutation = useAssignWaterMeterMutation();

  const clients = clientsQuery.data ?? [];
  const waterMeters = waterMetersQuery.data ?? [];
  const isLoading = clientsQuery.isLoading || waterMetersQuery.isLoading;

  const { success, info, error } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'paid' | 'active_clients'>('all');
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Modal States
  const [readingModalClient, setReadingModalClient] = useState<ClientWithMeter | null>(null);
  const [newReadingVal, setNewReadingVal] = useState<number>(0);
  const [isNewCycle, setIsNewCycle] = useState<boolean>(true);

  const [paymentModalClient, setPaymentModalClient] = useState<ClientWithMeter | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Mobile Money');
  const [paymentReference, setPaymentReference] = useState<string>('');

  const [historyModalClient, setHistoryModalClient] = useState<ClientWithMeter | null>(null);

  const [assignModalClient, setAssignModalClient] = useState<Client | null>(null);
  const [assignMeterNum, setAssignMeterNum] = useState('');
  const [assignStartReading, setAssignStartReading] = useState(0);

  // Combine ALL clients with their water meter records
  const allClientsWithMeters: ClientWithMeter[] = clients.map((client) => {
    const meter = waterMeters.find(
      (m) =>
        m.clientId === client.id ||
        (m.roomNumber === client.currentRoomNumber && m.propertyName === client.currentPropertyName)
    );
    return { client, meter };
  });

  // Sort: ACTIVE clients ALWAYS ON TOP, then by name
  const sortedClientsWithMeters = [...allClientsWithMeters].sort((a, b) => {
    const aIsActive = a.client.status === 'active' ? 1 : 0;
    const bIsActive = b.client.status === 'active' ? 1 : 0;
    if (bIsActive !== aIsActive) {
      return bIsActive - aIsActive; // Active on top
    }
    return a.client.name.localeCompare(b.client.name);
  });

  // Filtered List
  const filteredList = useMemo(() => sortedClientsWithMeters.filter(({ client, meter }) => {
    if (statusFilter === 'active_clients' && client.status !== 'active') return false;
    if (statusFilter === 'unpaid' && meter?.paymentStatus !== 'pending' && meter?.paymentStatus !== 'overdue') {
      return false;
    }
    if (statusFilter === 'paid' && meter?.paymentStatus !== 'paid') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        client.name.toLowerCase().includes(q) ||
        client.phone.toLowerCase().includes(q) ||
        client.currentPropertyName.toLowerCase().includes(q) ||
        client.currentRoomNumber.toLowerCase().includes(q) ||
        (meter?.meterNumber && meter.meterNumber.toLowerCase().includes(q))
      );
    }
    return true;
  }), [sortedClientsWithMeters, statusFilter, searchQuery]);

  const pagedList = useMemo(() => {
    const start = (pageIndex - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, pageIndex, pageSize]);

  // Calculations
  const totalConsumptionM3 = waterMeters.reduce((acc, m) => acc + (m.consumptionM3 || 0), 0);
  const totalBilledWater = waterMeters.reduce((acc, m) => acc + (m.totalAmount || 0), 0);
  const unpaidBillsCount = waterMeters.filter((m) => m.paymentStatus === 'pending' || m.paymentStatus === 'overdue').length;
  const unpaidTotalAmount = waterMeters
    .filter((m) => m.paymentStatus === 'pending' || m.paymentStatus === 'overdue')
    .reduce((acc, m) => acc + m.totalAmount, 0);

  // Handle Recording New Meter Reading
  const handleSaveNewReading = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!readingModalClient || !readingModalClient.meter) return;

    try {
      await updateReadingMutation.mutateAsync({
        id: readingModalClient.meter.id,
        currentReading: Number(newReadingVal),
        newBillingCycle: isNewCycle,
      });
      success(
        'Reading Recorded & Bill Generated',
        `Meter ${readingModalClient.meter.meterNumber} updated to ${newReadingVal} m³. Generated charge for ${readingModalClient.client.name}.`
      );
      setReadingModalClient(null);
    } catch {
      error('Save Failed', 'Could not record this meter reading. Please try again.');
    }
  };

  // Handle Recording Payment for Water Bill
  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalClient || !paymentModalClient.meter) return;

    try {
      await recordPaymentMutation.mutateAsync({
        id: paymentModalClient.meter.id,
        paymentMethod,
        reference: paymentReference || `MOMO-WTR-${Date.now().toString().slice(-5)}`,
      });
      success(
        'Payment Recorded',
        `Marked water bill of $${paymentModalClient.meter.totalAmount} as PAID for ${paymentModalClient.client.name}.`
      );
      setPaymentModalClient(null);
    } catch {
      error('Payment Failed', 'Could not record this payment. Please try again.');
    }
  };

  // Handle Assigning Meter to Client
  const handleAssignMeterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModalClient) return;

    try {
      await assignMeterMutation.mutateAsync({
        clientId: assignModalClient.id,
        meterNumber: assignMeterNum,
        initialReading: Number(assignStartReading),
      });
      success(
        'Meter Assigned',
        `Assigned meter ${assignMeterNum} to ${assignModalClient.name} with start reading ${assignStartReading} m³.`
      );
      setAssignModalClient(null);
      setAssignMeterNum('');
      setAssignStartReading(0);
    } catch {
      error('Assignment Failed', 'Could not assign this water meter. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-slate-400">
        Loading water meter ledger...
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 text-xs font-bold mb-1 border border-sky-200 dark:border-sky-800/60">
            <Droplets className="w-3.5 h-3.5" />
            Utility Submetering & Tenant Billing Ledger
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 dark:text-white">
            Water Meter Readings & Client Billing
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Comprehensive tenant registry sorted with active residents on top. Record new readings, generate utility bills, settle payments, and review historical consumption trends.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-2xl border shadow-soft space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Portfolio Volume</span>
          <p className="text-2xl font-extrabold font-display text-sky-600 dark:text-sky-400">
            {totalConsumptionM3.toFixed(1)} m³
          </p>
          <p className="text-[11px] text-slate-500">Current active monthly cycle</p>
        </div>

        <div className="glass-card p-4 rounded-2xl border shadow-soft space-y-1 bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900">
          <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Total Billed Utilities</span>
          <p className="text-2xl font-extrabold font-display text-emerald-600 dark:text-emerald-400">
            ${totalBilledWater.toFixed(2)}
          </p>
          <p className="text-[11px] text-emerald-600 font-semibold">Standard rate: $1.75 / m³</p>
        </div>

        <div className="glass-card p-4 rounded-2xl border shadow-soft space-y-1 bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
          <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">Unpaid Water Bills</span>
          <p className="text-2xl font-extrabold font-display text-amber-600 dark:text-amber-400">
            ${unpaidTotalAmount.toFixed(2)}
          </p>
          <p className="text-[11px] text-amber-600 font-semibold">{unpaidBillsCount} Tenant Bills Pending</p>
        </div>

        <div className="glass-card p-4 rounded-2xl border shadow-soft space-y-1 bg-brand-50/40 dark:bg-brand-950/20 border-brand-200 dark:border-brand-900">
          <span className="text-[10px] uppercase font-bold text-brand-600 dark:text-brand-400">Total Registered Clients</span>
          <p className="text-2xl font-extrabold font-display text-slate-900 dark:text-white">
            {clients.length} Clients
          </p>
          <p className="text-[11px] text-brand-600 font-semibold">{clients.filter((c) => c.status === 'active').length} Active Residents</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 rounded-2xl shadow-soft flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by client name, meter #, unit, phone, estate..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            All Clients ({clients.length})
          </button>

          <button
            onClick={() => setStatusFilter('active_clients')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              statusFilter === 'active_clients'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            Active Residents Only ({clients.filter((c) => c.status === 'active').length})
          </button>

          <button
            onClick={() => setStatusFilter('unpaid')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              statusFilter === 'unpaid'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            Unpaid / Pending Bills ({unpaidBillsCount})
          </button>

          <button
            onClick={() => setStatusFilter('paid')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              statusFilter === 'paid'
                ? 'bg-sky-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            Settled (Paid)
          </button>
        </div>
      </div>

      {/* Main Clients & Water Meters Table */}
      <div className="glass-card rounded-3xl shadow-soft overflow-hidden border">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div>
            <h3 className="text-base font-extrabold font-display text-slate-900 dark:text-white">
              Client Water Utility Ledger
            </h3>
            <p className="text-xs text-slate-500">
              Active residents prioritised at the top • Last recorded meter numbers, generated bills, and payment settlements
            </p>
          </div>
          <span className="text-xs font-bold text-slate-400">
            Showing {filteredList.length} Clients
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold text-[10px] bg-slate-50/30 dark:bg-slate-800/20">
                <th className="py-3.5 px-6">Client / Resident</th>
                <th className="py-3.5 px-4">Estate & Unit</th>
                <th className="py-3.5 px-4">Meter ID</th>
                <th className="py-3.5 px-4">Prev (m³)</th>
                <th className="py-3.5 px-4">Current (m³)</th>
                <th className="py-3.5 px-4">Usage (m³)</th>
                <th className="py-3.5 px-4">Last Bill</th>
                <th className="py-3.5 px-4">Bill Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {pagedList.map(({ client, meter }) => {
                const isActive = client.status === 'active';
                const hasMeter = Boolean(meter);
                const isPaid = meter?.paymentStatus === 'paid';
                const hasBill = hasMeter && (meter?.totalAmount || 0) > 0;

                return (
                  <tr
                    key={client.id}
                    className={`transition-colors ${
                      isActive
                        ? 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                        : 'opacity-70 bg-slate-50/20 dark:bg-slate-900/20 hover:opacity-100'
                    }`}
                  >
                    {/* Client Info */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={client.avatar}
                          alt={client.name}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-slate-900 dark:text-white text-xs">{client.name}</p>
                            <Badge
                              variant={isActive ? 'success' : 'neutral'}
                              size="sm"
                            >
                              {client.status.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">{client.phone}</p>
                        </div>
                      </div>
                    </td>

                    {/* Unit & Estate */}
                    <td className="py-4 px-4">
                      <p className="font-bold text-brand-600 dark:text-brand-400 font-mono">
                        Unit {client.currentRoomNumber}
                      </p>
                      <p className="text-[10px] text-slate-500">{client.currentPropertyName}</p>
                    </td>

                    {/* Meter ID */}
                    <td className="py-4 px-4 font-mono">
                      {hasMeter ? (
                        <span className="font-bold text-slate-900 dark:text-white px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px]">
                          {meter?.meterNumber}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">No meter linked</span>
                      )}
                    </td>

                    {/* Previous Reading */}
                    <td className="py-4 px-4 font-mono font-medium">
                      {hasMeter ? `${meter?.previousReading.toFixed(1)}` : '—'}
                    </td>

                    {/* Current Reading */}
                    <td className="py-4 px-4 font-mono font-bold text-sky-600 dark:text-sky-400">
                      {hasMeter ? `${meter?.currentReading.toFixed(1)}` : '—'}
                    </td>

                    {/* Consumption Usage */}
                    <td className="py-4 px-4">
                      {hasMeter ? (
                        <span className="font-extrabold text-slate-900 dark:text-white">
                          {meter?.consumptionM3.toFixed(1)} m³
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Last Bill Amount */}
                    <td className="py-4 px-4 font-extrabold font-mono text-sm">
                      {hasMeter ? (
                        <span className={isPaid ? 'text-slate-700 dark:text-slate-300' : 'text-amber-600 dark:text-amber-400'}>
                          ${meter?.totalAmount.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal text-xs">—</span>
                      )}
                    </td>

                    {/* Bill Status */}
                    <td className="py-4 px-4">
                      {hasMeter ? (
                        <Badge
                          variant={isPaid ? 'success' : 'warning'}
                          size="sm"
                          dot
                        >
                          {meter?.paymentStatus === 'paid' ? 'PAID' : 'UNPAID'}
                        </Badge>
                      ) : (
                        <Badge variant="neutral" size="sm">UNASSIGNED</Badge>
                      )}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {hasMeter ? (
                          <>
                            {/* Record / Mark New Reading */}
                            <button
                              onClick={() => {
                                setReadingModalClient({ client, meter });
                                setNewReadingVal(meter?.currentReading || 0);
                                setIsNewCycle(true);
                              }}
                              title="Mark new meter reading"
                              className="px-2.5 py-1 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:hover:bg-sky-900 dark:text-sky-300 font-bold text-xs border border-sky-200 dark:border-sky-800 transition-colors inline-flex items-center gap-1"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>New Reading</span>
                            </button>

                            {/* Mark Paid / Settle Button */}
                            {!isPaid && hasBill && (
                              <button
                                onClick={() => {
                                  setPaymentModalClient({ client, meter });
                                  setPaymentMethod('Mobile Money');
                                  setPaymentReference(`MOMO-${Date.now().toString().slice(-6)}`);
                                }}
                                title="Mark bill as paid"
                                className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors inline-flex items-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Mark Paid</span>
                              </button>
                            )}

                            {/* View History Dossier */}
                            <button
                              onClick={() => setHistoryModalClient({ client, meter })}
                              title="View monthly consumption history & chart"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-slate-800 transition-colors"
                            >
                              <History className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              setAssignModalClient(client);
                              setAssignMeterNum(`WM-${client.currentRoomNumber}-01`);
                              setAssignStartReading(0);
                            }}
                            className="px-3 py-1 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 font-bold text-xs transition-colors"
                          >
                            + Assign Meter
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={pageIndex}
          totalItems={filteredList.length}
          pageSize={pageSize}
          onPageChange={(p) => setPageIndex(p)}
          onPageSizeChange={(s) => { setPageSize(s); setPageIndex(1); }}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 1. MODAL: RECORD NEW METER READING                          */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {readingModalClient && readingModalClient.meter && (
        <Modal
          isOpen={Boolean(readingModalClient)}
          onClose={() => setReadingModalClient(null)}
          title={`Mark Water Meter Reading: ${readingModalClient.meter.meterNumber}`}
          subtitle={`Resident: ${readingModalClient.client.name} • Unit ${readingModalClient.client.currentRoomNumber} (${readingModalClient.client.currentPropertyName})`}
        >
          <form onSubmit={handleSaveNewReading} className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Previous Logged Reading:</span>
                <span className="font-extrabold font-mono text-slate-900 dark:text-white">
                  {readingModalClient.meter.currentReading} m³
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Standard Water Rate:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  ${readingModalClient.meter.ratePerM3} per m³
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                New Physical Meter Reading (m³) *
              </label>
              <input
                type="number"
                step="0.1"
                required
                min={readingModalClient.meter.currentReading}
                value={newReadingVal}
                onChange={(e) => setNewReadingVal(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-extrabold font-mono text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none transition-all"
              />
            </div>

            {/* Auto-Calculated Calculation Card */}
            <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 space-y-2 text-sky-900 dark:text-sky-200">
              <div className="flex justify-between">
                <span className="font-semibold">Calculated Consumption:</span>
                <span className="font-extrabold font-mono text-sm">
                  {Math.max(0, newReadingVal - readingModalClient.meter.currentReading).toFixed(1)} m³
                </span>
              </div>
              <div className="flex justify-between border-t border-sky-200 dark:border-sky-800 pt-1.5">
                <span className="font-semibold">Generated Utility Bill:</span>
                <span className="font-extrabold font-mono text-base text-sky-600 dark:text-sky-400">
                  ${(Math.max(0, newReadingVal - readingModalClient.meter.currentReading) * readingModalClient.meter.ratePerM3).toFixed(2)}
                </span>
              </div>
              <p className="text-[10px] text-sky-600 dark:text-sky-400 mt-0.5">
                • Status will be marked as <strong>UNPAID</strong> until tenant payment is settled.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReadingModalClient(null)}
                className="px-4 py-2.5 rounded-xl text-slate-500 hover:bg-slate-100 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold shadow-md transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Reading & Issue Bill</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 2. MODAL: MARK WATER BILL AS PAID                           */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {paymentModalClient && paymentModalClient.meter && (
        <Modal
          isOpen={Boolean(paymentModalClient)}
          onClose={() => setPaymentModalClient(null)}
          title={`Record Water Bill Payment`}
          subtitle={`Settle utility charge for ${paymentModalClient.client.name} (Unit ${paymentModalClient.client.currentRoomNumber})`}
        >
          <form onSubmit={handleRecordPaymentSubmit} className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Meter ID:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {paymentModalClient.meter.meterNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Water Volume:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {paymentModalClient.meter.consumptionM3.toFixed(1)} m³
                </span>
              </div>
              <div className="flex justify-between border-t border-emerald-200 dark:border-emerald-800 pt-1.5">
                <span className="text-slate-500 font-semibold">Amount to Settle:</span>
                <span className="font-extrabold font-mono text-base text-emerald-600">
                  ${paymentModalClient.meter.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Payment Channel / Method *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              >
                <option value="Mobile Money">Mobile Money (MTN / Airtel)</option>
                <option value="Bank Transfer">Bank Transfer (BK / I&M / Equity)</option>
                <option value="Cash">Cash at Reception</option>
                <option value="Credit Card">Credit / Debit Card</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Transaction Reference / Receipt Code *
              </label>
              <input
                type="text"
                required
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="e.g. MOMO-98234-TX"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPaymentModalClient(null)}
                className="px-4 py-2.5 rounded-xl text-slate-500 hover:bg-slate-100 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md transition-all flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Confirm Payment Settlement</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 3. MODAL: CLIENT CONSUMPTION HISTORY & TREND CHART          */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {historyModalClient && historyModalClient.meter && (
        <Modal
          isOpen={Boolean(historyModalClient)}
          onClose={() => setHistoryModalClient(null)}
          title={`Water Consumption Dossier: ${historyModalClient.client.name}`}
          subtitle={`Meter ${historyModalClient.meter.meterNumber} • Unit ${historyModalClient.client.currentRoomNumber} (${historyModalClient.client.currentPropertyName})`}
          maxWidth="2xl"
        >
          <div className="space-y-6 text-xs">
            {/* Trend Chart */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 dark:text-white">
                  Monthly Consumption Trajectory (m³)
                </h4>
                <Badge variant="info" size="sm">Rate: $1.75 / m³</Badge>
              </div>
              <WaterConsumptionTrend history={historyModalClient.meter.history || []} />
            </div>

            {/* History Table */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">
                Past Monthly Logged Cycles
              </h4>
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase font-bold text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4">Period</th>
                      <th className="py-2.5 px-4">Reading (m³)</th>
                      <th className="py-2.5 px-4">Volume (m³)</th>
                      <th className="py-2.5 px-4 text-right">Billed Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(historyModalClient.meter.history || []).map((h, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-4 font-bold">{h.month}</td>
                        <td className="py-2.5 px-4 font-mono">{h.reading} m³</td>
                        <td className="py-2.5 px-4 font-extrabold text-sky-600">{h.consumption} m³</td>
                        <td className="py-2.5 px-4 font-extrabold font-mono text-emerald-600 text-right">
                          ${h.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setHistoryModalClient(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold hover:bg-slate-200"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 4. MODAL: ASSIGN METER TO CLIENT                            */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {assignModalClient && (
        <Modal
          isOpen={Boolean(assignModalClient)}
          onClose={() => setAssignModalClient(null)}
          title={`Assign Water Meter`}
          subtitle={`Link physical submeter to ${assignModalClient.name} in Unit ${assignModalClient.currentRoomNumber}`}
        >
          <form onSubmit={handleAssignMeterSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Meter Number / Identifier *
              </label>
              <input
                type="text"
                required
                value={assignMeterNum}
                onChange={(e) => setAssignMeterNum(e.target.value)}
                placeholder="e.g. WM-204-KH"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Initial Start Reading (m³) *
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={assignStartReading}
                onChange={(e) => setAssignStartReading(Number(e.target.value))}
                placeholder="0.0"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAssignModalClient(null)}
                className="px-4 py-2.5 rounded-xl text-slate-500 hover:bg-slate-100 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-md transition-all flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Link Submeter</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
