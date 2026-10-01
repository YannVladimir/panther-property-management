import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { Search, Building, User, DoorOpen, Calendar, Receipt, Wrench, ArrowRight, X } from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const { clients, rooms, properties, bookings, payments, technicians, maintenanceIssues } = useData();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Toggle or open
      }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const cleanQuery = query.trim().toLowerCase();

  const matchedRooms = cleanQuery
    ? rooms.filter(
        (r) =>
          r.roomNumber.toLowerCase().includes(cleanQuery) ||
          r.propertyName.toLowerCase().includes(cleanQuery) ||
          r.furnishingType.toLowerCase().includes(cleanQuery)
      )
    : rooms.slice(0, 3);

  const matchedClients = cleanQuery
    ? clients.filter(
        (c) =>
          c.name.toLowerCase().includes(cleanQuery) ||
          c.email.toLowerCase().includes(cleanQuery) ||
          c.currentRoomNumber.toLowerCase().includes(cleanQuery) ||
          c.phone.toLowerCase().includes(cleanQuery)
      )
    : clients.slice(0, 3);

  const matchedProperties = cleanQuery
    ? properties.filter(
        (p) =>
          p.name.toLowerCase().includes(cleanQuery) ||
          p.location.toLowerCase().includes(cleanQuery) ||
          p.neighborhood.toLowerCase().includes(cleanQuery)
      )
    : properties.slice(0, 2);

  const matchedBookings = cleanQuery
    ? bookings.filter(
        (b) =>
          b.bookingNumber.toLowerCase().includes(cleanQuery) ||
          b.clientName.toLowerCase().includes(cleanQuery) ||
          b.propertyName.toLowerCase().includes(cleanQuery)
      )
    : [];

  const matchedPayments = cleanQuery
    ? payments.filter(
        (p) =>
          p.invoiceNumber.toLowerCase().includes(cleanQuery) ||
          p.clientName.toLowerCase().includes(cleanQuery) ||
          p.reference.toLowerCase().includes(cleanQuery)
      )
    : [];

  const matchedTechnicians = cleanQuery
    ? technicians.filter(
        (t) =>
          t.name.toLowerCase().includes(cleanQuery) ||
          t.specialization.toLowerCase().includes(cleanQuery) ||
          t.company.toLowerCase().includes(cleanQuery)
      )
    : [];

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="flex min-h-full items-start justify-center p-4 pt-16 sm:pt-24 text-center">
        <div className="relative transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left shadow-2xl transition-all w-full max-w-2xl z-10 animate-in fade-in zoom-in-95 duration-150">
          {/* Search Bar Input */}
          <div className="flex items-center px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
            <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
            <input
              type="text"
              placeholder="Search apartments, rooms (e.g. A-204), tenants, payments, bookings, technicians..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="w-full bg-transparent border-0 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-0 focus:outline-none text-base"
            />
            {query && (
              <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 rounded border border-slate-200 dark:border-slate-700">
              ESC
            </kbd>
          </div>

          {/* Results Container */}
          <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
            {/* Rooms / Apartments */}
            {matchedRooms.length > 0 && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1.5 flex items-center gap-1.5">
                  <DoorOpen className="w-3.5 h-3.5 text-brand-500" />
                  Apartments & Rooms
                </p>
                <div className="space-y-1">
                  {matchedRooms.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => handleSelect(`/room/${r.id}`)}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-xs">
                          {r.roomNumber}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400">
                            Unit {r.roomNumber} — {r.propertyName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {r.furnishingType} • ${r.monthlyRent}/mo • Status: {r.status}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-500 transform group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Clients */}
            {matchedClients.length > 0 && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-500" />
                  Clients / Tenants
                </p>
                <div className="space-y-1">
                  {matchedClients.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => handleSelect('/operations/clients')}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <img src={c.avatar} alt={c.name} className="w-9 h-9 rounded-full object-cover border" />
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400">
                            {c.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {c.currentPropertyName} (Unit {c.currentRoomNumber}) • {c.email}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                        {c.paymentStatus}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Properties */}
            {matchedProperties.length > 0 && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1.5 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-purple-500" />
                  Properties
                </p>
                <div className="space-y-1">
                  {matchedProperties.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleSelect(`/property/${p.id}`)}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <img src={p.images[0]} alt={p.name} className="w-12 h-9 rounded-lg object-cover" />
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400">
                            {p.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {p.location} • {p.totalRooms} Rooms ({p.occupiedRooms} Occupied)
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-500" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bookings */}
            {matchedBookings.length > 0 && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" />
                  Bookings
                </p>
                <div className="space-y-1">
                  {matchedBookings.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => handleSelect('/operations/bookings')}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer transition-colors group"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {b.bookingNumber} — {b.clientName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {b.propertyName} • {b.rentalTypeName} • Move-in: {b.moveInDate}
                        </p>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                        {b.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payments */}
            {matchedPayments.length > 0 && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1.5 flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-emerald-500" />
                  Payments
                </p>
                <div className="space-y-1">
                  {matchedPayments.map((pay) => (
                    <div
                      key={pay.id}
                      onClick={() => handleSelect('/operations/payments')}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer transition-colors"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {pay.invoiceNumber} — ${pay.amount} ({pay.type})
                        </p>
                        <p className="text-xs text-slate-500">
                          {pay.clientName} • {pay.method} ({pay.reference})
                        </p>
                      </div>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {pay.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Technicians */}
            {matchedTechnicians.length > 0 && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1.5 flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-sky-500" />
                  Technicians
                </p>
                <div className="space-y-1">
                  {matchedTechnicians.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => handleSelect('/operations/technicians')}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <img src={t.avatar} alt={t.name} className="w-8 h-8 rounded-full object-cover" />
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{t.name}</p>
                          <p className="text-xs text-slate-500">
                            {t.specialization} • {t.company} • ★ {t.rating}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-slate-400">{t.contact}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Tip */}
          <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Tip: Try searching for &ldquo;A-204&rdquo;, &ldquo;Jean&rdquo;, &ldquo;Kigali Heights&rdquo;, or &ldquo;Plumber&rdquo;</span>
            <span className="hidden sm:inline">Use ↑↓ to navigate</span>
          </div>
        </div>
      </div>
    </div>
  );
};
