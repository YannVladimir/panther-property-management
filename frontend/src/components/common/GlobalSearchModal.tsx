import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobalSearchQuery, SearchResultItem } from '../../api/search';
import { Search, Building, User, Calendar, Wrench, Briefcase, ArrowRight, X } from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function byCategory(results: SearchResultItem[], category: SearchResultItem['category']) {
  return results.filter((r) => r.category === category);
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
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

  const searchQuery = useGlobalSearchQuery(query);
  const results = searchQuery.data ?? [];

  if (!isOpen) return null;

  // Real GET /search fans out across properties/clients/bookings/employees/technicians only — it
  // has no room or payment search at all (confirmed against SearchService.java), unlike the old
  // mock modal which searched local rooms/payments arrays. That's a genuine backend capability gap,
  // not something a frontend-only pass can fix, so those two categories are simply absent below
  // rather than faked with stale local data.
  const matchedProperties = byCategory(results, 'PROPERTY');
  const matchedClients = byCategory(results, 'CLIENT');
  const matchedBookings = byCategory(results, 'BOOKING');
  const matchedEmployees = byCategory(results, 'EMPLOYEE');
  const matchedTechnicians = byCategory(results, 'TECHNICIAN');

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
            {searchQuery.isFetching && (
              <p className="text-xs text-slate-400 text-center py-6">Searching…</p>
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
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400">
                          {c.title}
                        </p>
                        <p className="text-xs text-slate-500">{c.subtitle}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-500" />
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
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400">
                          {p.title}
                        </p>
                        <p className="text-xs text-slate-500">{p.subtitle}</p>
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
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{b.title}</p>
                        <p className="text-xs text-slate-500">{b.subtitle}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Employees */}
            {matchedEmployees.length > 0 && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1.5 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                  Staff
                </p>
                <div className="space-y-1">
                  {matchedEmployees.map((e) => (
                    <div
                      key={e.id}
                      onClick={() => handleSelect(`/operations/hr-payroll/${e.id}`)}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer transition-colors group"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{e.title}</p>
                        <p className="text-xs text-slate-500">{e.subtitle}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-500" />
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
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{t.title}</p>
                        <p className="text-xs text-slate-500">{t.subtitle}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!searchQuery.isFetching && query.trim() && results.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6">No results for &ldquo;{query}&rdquo;.</p>
            )}
          </div>

          {/* Modal Footer Tip */}
          <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Tip: Try searching for a property, tenant, booking number, or technician name.</span>
            <span className="hidden sm:inline">Use ↑↓ to navigate</span>
          </div>
        </div>
      </div>
    </div>
  );
};
