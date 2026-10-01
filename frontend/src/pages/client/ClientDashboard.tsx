import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import confetti from 'canvas-confetti';
import {
  DoorOpen,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  Wrench,
  Package,
  Receipt,
  ArrowRight,
  AlertCircle,
  FileText,
  Plus,
  Sparkles,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { StatCard } from '../../components/common/StatCard';
import { Modal } from '../../components/common/Modal';

export const ClientDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { clients, rooms, payments, maintenanceIssues, addPayment } = useData();
  const { success } = useToast();
  const navigate = useNavigate();

  // Find active client record (defaults to Jean-Paul Ndahiro)
  const client = clients.find((c) => c.id === currentUser?.clientId) || clients[0];
  const clientRoom = rooms.find((r) => r.id === client.currentRoomId) || rooms[0];
  const clientPayments = payments.filter((p) => p.clientId === client.id);
  const clientIssues = maintenanceIssues.filter((i) => i.clientId === client.id);

  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState(client.monthlyRent);
  const [payMethod, setPayMethod] = useState<'Mobile Money' | 'Bank Transfer' | 'Credit Card'>('Mobile Money');
  const [isProcessingPay, setIsProcessingPay] = useState(false);

  const handleSimulatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingPay(true);

    setTimeout(() => {
      addPayment({
        clientId: client.id,
        clientName: client.name,
        clientAvatar: client.avatar,
        propertyId: client.currentPropertyId,
        propertyName: client.currentPropertyName,
        roomId: client.currentRoomId,
        roomNumber: client.currentRoomNumber,
        amount: payAmount,
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date().toISOString().split('T')[0],
        type: 'rent',
        method: payMethod,
        reference: `MOMO-${Math.floor(1000000 + Math.random() * 9000000)}`,
        status: 'paid',
        notes: `Monthly rent settled by ${client.name}`,
      });

      setIsProcessingPay(false);
      setPayModalOpen(false);

      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      } catch (err) {}

      success('Payment Successful!', `Recorded payment of $${payAmount} via ${payMethod}. Receipt generated.`);
    }, 600);
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner Card */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-navy-900 to-brand-950 p-6 sm:p-8 text-white border border-slate-800 shadow-premium flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-brand-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            Resident Portal • Active Tenancy
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display">
            Welcome back, {client.name} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            {client.currentPropertyName} • Unit {client.currentRoomNumber} ({client.rentalType})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setPayModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-colors flex items-center gap-2"
          >
            <DollarSign className="w-4 h-4" />
            <span>Pay Monthly Rent</span>
          </button>
          <Link
            to="/client/report-issue"
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-colors flex items-center gap-2"
          >
            <Wrench className="w-4 h-4 text-amber-400" />
            <span>Report an Issue</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Current Room"
          value={`Unit ${client.currentRoomNumber}`}
          subtitle={client.rentalType}
          icon={DoorOpen}
          accentColor="brand"
          onClick={() => navigate('/client/my-room')}
        />
        <StatCard
          title="Monthly Rent"
          value={`$${client.monthlyRent}`}
          subtitle="Due on 1st of month"
          icon={DollarSign}
          accentColor="emerald"
        />
        <StatCard
          title="Next Due Date"
          value="Sept 01"
          subtitle="Auto-invoiced monthly"
          icon={Calendar}
          accentColor="sky"
        />
        <StatCard
          title="Payment Status"
          value={client.paymentStatus.toUpperCase()}
          subtitle="All dues up to date"
          icon={CheckCircle2}
          accentColor={client.paymentStatus === 'paid' ? 'emerald' : 'rose'}
        />
      </div>

      {/* Main Grid: My Materials & Maintenance Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 cols: Assigned Inventory & Open Tickets */}
        <div className="lg:col-span-2 space-y-8">
          {/* Assigned Materials Summary */}
          <div className="glass-card p-6 rounded-3xl shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold font-display text-slate-900 dark:text-white">
                  My Assigned Materials & Furniture
                </h3>
                <p className="text-xs text-slate-500">
                  Inventory items provided with Room {client.currentRoomNumber}
                </p>
              </div>
              <Link
                to="/client/my-materials"
                className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
              >
                <span>View all ({client.materials.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold text-[10px]">
                    <th className="pb-3">Item Name</th>
                    <th className="pb-3">Qty</th>
                    <th className="pb-3">Serial No</th>
                    <th className="pb-3">Condition</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {client.materials.slice(0, 4).map((mat) => (
                    <tr key={mat.id} className="py-2">
                      <td className="py-2.5 font-semibold text-slate-900 dark:text-white">{mat.name}</td>
                      <td className="py-2.5">{mat.quantity}x</td>
                      <td className="py-2.5 text-slate-500 font-mono text-[11px]">{mat.serialNumber}</td>
                      <td className="py-2.5">
                        <Badge variant={mat.condition === 'Excellent' || mat.condition === 'Good' ? 'success' : 'warning'} size="sm">
                          {mat.condition}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Active Maintenance Requests */}
          <div className="glass-card p-6 rounded-3xl shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold font-display text-slate-900 dark:text-white">
                  Maintenance & Service Requests
                </h3>
                <p className="text-xs text-slate-500">
                  Recent repair tickets reported for Unit {client.currentRoomNumber}
                </p>
              </div>
              <Link
                to="/client/report-issue"
                className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
              >
                <span>New Ticket</span>
                <Plus className="w-3.5 h-3.5" />
              </Link>
            </div>

            {clientIssues.length > 0 ? (
              <div className="space-y-3">
                {clientIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 font-mono">{issue.ticketNumber}</span>
                        <Badge variant="purple" size="sm">{issue.category}</Badge>
                        <span className="text-[10px] text-slate-400">{issue.reportedDate}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{issue.title}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{issue.description}</p>
                      {issue.assignedTechnicianName && (
                        <p className="text-[10px] text-brand-600 dark:text-brand-400 font-semibold">
                          Assigned to: {issue.assignedTechnicianName} ({issue.technicianSpecialty})
                        </p>
                      )}
                    </div>

                    <Badge
                      variant={
                        issue.status === 'Resolved' || issue.status === 'Closed'
                          ? 'success'
                          : issue.status === 'In Progress'
                          ? 'warning'
                          : 'info'
                      }
                      size="sm"
                    >
                      {issue.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">No open maintenance requests.</p>
            )}
          </div>
        </div>

        {/* Right 1 col: Recent Payments & Lease Overview */}
        <div className="space-y-6">
          {/* Recent Payments Card */}
          <div className="glass-card p-6 rounded-3xl shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
                Payment History
              </h3>
              <Link to="/client/payments" className="text-xs font-bold text-brand-600 hover:underline">
                View all
              </Link>
            </div>

            <div className="space-y-3">
              {clientPayments.slice(0, 3).map((pay) => (
                <div
                  key={pay.id}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      ${pay.amount} <span className="text-[10px] text-slate-400 capitalize">({pay.type})</span>
                    </p>
                    <p className="text-[10px] text-slate-500">{pay.date} • {pay.method}</p>
                  </div>
                  <Badge variant="success" size="sm">Paid</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Lease Summary */}
          <div className="glass-card p-6 rounded-3xl shadow-soft space-y-3">
            <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
              Lease Agreement
            </h3>
            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex justify-between">
                <span>Move-in Date:</span>
                <strong className="text-slate-900 dark:text-white">{client.moveInDate}</strong>
              </div>
              <div className="flex justify-between">
                <span>Lease Expiry:</span>
                <strong className="text-slate-900 dark:text-white">{client.leaseExpiryDate}</strong>
              </div>
              <div className="flex justify-between">
                <span>Security Deposit:</span>
                <strong className="text-slate-900 dark:text-white">${client.depositPaid} (Secured)</strong>
              </div>
            </div>
            <Link
              to="/client/my-booking"
              className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold hover:bg-slate-200 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-brand-500" />
              <span>View Full Contract</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Instant Rent Payment Simulation Modal */}
      <Modal isOpen={payModalOpen} onClose={() => setPayModalOpen(false)} title="Pay Monthly Rent">
        <form onSubmit={handleSimulatePayment} className="space-y-4">
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs space-y-1">
            <p className="font-bold">Unit {client.currentRoomNumber} — {client.currentPropertyName}</p>
            <p>Monthly Rent Amount: <strong>${client.monthlyRent}</strong></p>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 font-bold mb-1">
              Payment Amount ($ USD) *
            </label>
            <input
              type="number"
              required
              value={payAmount}
              onChange={(e) => setPayAmount(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 font-bold mb-1">
              Select Payment Method *
            </label>
            <select
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
            >
              <option value="Mobile Money">MTN Mobile Money / Airtel Money</option>
              <option value="Bank Transfer">Bank of Kigali / I&M Bank Transfer</option>
              <option value="Credit Card">Visa / Mastercard Online</option>
            </select>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={isProcessingPay}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all"
            >
              {isProcessingPay ? 'Authorizing Payment...' : `Authorize $${payAmount} Payment`}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
