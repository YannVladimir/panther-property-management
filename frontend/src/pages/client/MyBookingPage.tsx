import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  CalendarCheck2,
  Building,
  CheckCircle2,
  FileText,
  Clock,
  ShieldCheck,
  User,
  Phone,
  Mail,
  MapPin,
  Download,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export const MyBookingPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { clients, bookings, properties, rooms } = useData();

  const client = clients.find((c) => c.id === currentUser?.clientId) || clients[0];
  const clientBooking = bookings.find((b) => b.clientId === client.id) || bookings[0];
  const property = properties.find((p) => p.id === client.currentPropertyId) || properties[0];
  const room = rooms.find((r) => r.id === client.currentRoomId) || rooms[0];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Tenancy Contract & History
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 dark:text-white mt-1">
            My Booking & Lease Agreement
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Booking reference: <span className="font-mono font-bold text-slate-900 dark:text-white">{clientBooking.bookingNumber}</span>
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Print / Export Agreement</span>
        </button>
      </div>

      {/* Booking Status Card */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl shadow-soft space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="success" size="md" dot>
                  {clientBooking.status.replace('_', ' ').toUpperCase()}
                </Badge>
                <span className="text-xs font-semibold text-slate-400">Confirmed Tenancy</span>
              </div>
              <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white mt-1">
                Unit {client.currentRoomNumber} — {client.currentPropertyName}
              </h2>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-slate-400">Agreed Monthly Rent</span>
            <p className="text-2xl font-extrabold text-brand-600 dark:text-brand-400">
              ${clientBooking.monthlyRent}<span className="text-xs font-normal text-slate-500">/mo</span>
            </p>
          </div>
        </div>

        {/* Core Lease Specs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-[11px] uppercase font-bold text-slate-400">Rental Package</span>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{client.rentalType}</p>
          </div>
          <div>
            <span className="text-[11px] uppercase font-bold text-slate-400">Move-in Date</span>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{client.moveInDate}</p>
          </div>
          <div>
            <span className="text-[11px] uppercase font-bold text-slate-400">Lease Expiry</span>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{client.leaseExpiryDate}</p>
          </div>
          <div>
            <span className="text-[11px] uppercase font-bold text-slate-400">Deposit Held</span>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">${client.depositPaid} (Escrow)</p>
          </div>
        </div>
      </div>

      {/* Booking Verification & Check-in Timeline */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl shadow-soft space-y-6">
        <h3 className="text-lg font-bold font-display text-slate-900 dark:text-white">
          Onboarding & Tenancy Timeline
        </h3>

        <div className="space-y-6 relative pl-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-brand-200 dark:before:bg-brand-900">
          {clientBooking.timeline.map((step, idx) => (
            <div key={idx} className="relative flex items-start gap-4">
              <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-brand-600 border-4 border-white dark:border-slate-900" />
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                    {step.status.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{step.timestamp}</span>
                </div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{step.note}</p>
                <p className="text-[10px] text-slate-400">Updated by: {step.updatedBy}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resident & Emergency Contacts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="glass-card p-6 rounded-2xl shadow-soft space-y-3">
          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Tenant Information
          </h4>
          <div className="space-y-1.5 text-xs">
            <p className="font-bold text-slate-900 dark:text-white">{client.name}</p>
            <p className="text-slate-500">ID / Passport: {client.identificationNumber}</p>
            <p className="text-slate-500">Nationality: {client.nationality}</p>
            <p className="text-slate-500">Email: {client.email}</p>
            <p className="text-slate-500">Phone: {client.phone}</p>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl shadow-soft space-y-3">
          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Emergency Contact
          </h4>
          <div className="space-y-1.5 text-xs">
            <p className="font-bold text-slate-900 dark:text-white">{client.emergencyContact.name}</p>
            <p className="text-slate-500">Relationship: {client.emergencyContact.relationship}</p>
            <p className="text-slate-500">Phone: {client.emergencyContact.phone}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
