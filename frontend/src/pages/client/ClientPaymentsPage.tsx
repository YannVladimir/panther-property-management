import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import confetti from 'canvas-confetti';
import {
  Receipt,
  DollarSign,
  Download,
  CreditCard,
  CheckCircle2,
  Clock,
  Printer,
  FileText,
  Plus,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Payment } from '../../types';

export const ClientPaymentsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { clients, payments, addPayment } = useData();
  const { success } = useToast();

  const client = clients.find((c) => c.id === currentUser?.clientId) || clients[0];
  const clientPayments = payments.filter((p) => p.clientId === client.id);

  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [amount, setAmount] = useState(client.monthlyRent);
  const [payType, setPayType] = useState<Payment['type']>('rent');
  const [method, setMethod] = useState<Payment['method']>('Mobile Money');
  const [isPaying, setIsPaying] = useState(false);

  const handleMakePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsPaying(true);

    setTimeout(() => {
      const newPay = addPayment({
        clientId: client.id,
        clientName: client.name,
        clientAvatar: client.avatar,
        propertyId: client.currentPropertyId,
        propertyName: client.currentPropertyName,
        roomId: client.currentRoomId,
        roomNumber: client.currentRoomNumber,
        amount,
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date().toISOString().split('T')[0],
        type: payType,
        method,
        reference: `MOMO-${Math.floor(1000000 + Math.random() * 9000000)}`,
        status: 'paid',
        notes: `Online tenant portal payment (${payType})`,
      });

      setIsPaying(false);
      setPayModalOpen(false);

      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      } catch (err) {}

      success('Payment Successful', `Invoice ${newPay.invoiceNumber} paid via ${method}.`);
    }, 600);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Billing & Invoices
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 dark:text-white mt-1">
            Payments & Receipts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            View historical rent transactions, water utilities, and download official receipts.
          </p>
        </div>

        <button
          onClick={() => setPayModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-colors"
        >
          <DollarSign className="w-4 h-4" />
          <span>Make a Payment</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="glass-card p-5 rounded-2xl border shadow-soft">
          <span className="text-[11px] uppercase font-bold text-slate-400">Total Settled</span>
          <p className="text-2xl font-bold font-display text-emerald-600 dark:text-emerald-400 mt-1">
            ${clientPayments.filter((p) => p.status === 'paid').reduce((acc, p) => acc + p.amount, 0).toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-1">{clientPayments.length} transactions recorded</p>
        </div>
        <div className="glass-card p-5 rounded-2xl border shadow-soft">
          <span className="text-[11px] uppercase font-bold text-slate-400">Monthly Rent</span>
          <p className="text-2xl font-bold font-display text-slate-900 dark:text-white mt-1">
            ${client.monthlyRent}
          </p>
          <p className="text-xs text-slate-500 mt-1">Room {client.currentRoomNumber}</p>
        </div>
        <div className="glass-card p-5 rounded-2xl border shadow-soft">
          <span className="text-[11px] uppercase font-bold text-slate-400">Next Due Date</span>
          <p className="text-2xl font-bold font-display text-brand-600 dark:text-brand-400 mt-1">
            Sept 01, 2026
          </p>
          <p className="text-xs text-emerald-600 font-semibold mt-1">Status: Current</p>
        </div>
      </div>

      {/* Payments Table */}
      <div className="glass-card rounded-3xl shadow-soft overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
            Transaction Ledger
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold text-[10px] bg-slate-50/50 dark:bg-slate-800/30">
                <th className="py-3.5 px-6">Invoice #</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Method & Ref</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-6 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {clientPayments.map((pay) => (
                <tr key={pay.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-6 font-bold font-mono text-slate-900 dark:text-white">
                    {pay.invoiceNumber}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">{pay.date}</td>
                  <td className="py-3.5 px-4 capitalize font-semibold">{pay.type}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                    ${pay.amount}
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-medium text-slate-800 dark:text-slate-200">{pay.method}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{pay.reference}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant={pay.status === 'paid' ? 'success' : 'warning'} size="sm">
                      {pay.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    <button
                      onClick={() => setSelectedReceipt(pay)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 hover:text-brand-600 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>Receipt</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      {selectedReceipt && (
        <Modal
          isOpen={Boolean(selectedReceipt)}
          onClose={() => setSelectedReceipt(null)}
          maxWidth="md"
          title="Official Payment Receipt"
        >
          <div className="space-y-6 pt-2 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-base font-extrabold font-display text-brand-600">PANTHER LIVING</span>
                <p className="text-[10px] text-slate-400">KG 7 Ave, Kigali Heights Tower, Gasabo</p>
              </div>
              <Badge variant="success" size="sm">PAID & VERIFIED</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Receipt Number</span>
                <p className="font-mono font-bold">{selectedReceipt.invoiceNumber}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Payment Date</span>
                <p className="font-semibold">{selectedReceipt.date}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Resident Name</span>
                <p className="font-semibold">{selectedReceipt.clientName}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Property & Room</span>
                <p className="font-semibold">{selectedReceipt.propertyName} (Unit {selectedReceipt.roomNumber})</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 capitalize">{selectedReceipt.type} Charge:</span>
                <span className="font-bold">${selectedReceipt.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Method:</span>
                <span>{selectedReceipt.method} ({selectedReceipt.reference})</span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-bold text-sm">
                <span>Total Settled:</span>
                <span className="text-emerald-600 dark:text-emerald-400">${selectedReceipt.amount}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 dark:bg-brand-600 text-white text-xs font-bold shadow-md hover:bg-brand-700 transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Receipt</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Pay Modal */}
      <Modal isOpen={payModalOpen} onClose={() => setPayModalOpen(false)} title="Pay Rent or Utilities">
        <form onSubmit={handleMakePayment} className="space-y-4">
          <div>
            <label className="block text-[10px] text-slate-400 font-bold mb-1">
              Payment Category *
            </label>
            <select
              value={payType}
              onChange={(e) => setPayType(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
            >
              <option value="rent">Monthly Apartment Rent</option>
              <option value="utility">Water / Utility Submeter Bill</option>
              <option value="deposit">Security Deposit</option>
              <option value="other">Other Charge</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 font-bold mb-1">
              Amount ($ USD) *
            </label>
            <input
              type="number"
              required
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 font-bold mb-1">
              Payment Channel *
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
            >
              <option value="Mobile Money">MTN Mobile Money / Airtel Money</option>
              <option value="Bank Transfer">Bank of Kigali / I&M Bank Transfer</option>
              <option value="Credit Card">Visa / Mastercard</option>
            </select>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isPaying}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all"
            >
              {isPaying ? 'Processing...' : `Confirm $${amount} Payment`}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
