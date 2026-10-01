import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { Shield, User, Building, Crown, Wrench, Globe, ChevronDown } from 'lucide-react';

export const RoleSwitcher: React.FC = () => {
  const { currentRole, switchRole, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const roles: { role: UserRole; label: string; icon: React.ReactNode; path: string; desc: string }[] = [
    { role: 'public', label: 'Public Portal', icon: <Globe className="w-4 h-4" />, path: '/', desc: 'Apartment search & guest booking' },
    { role: 'client', label: 'Client (Tenant)', icon: <User className="w-4 h-4" />, path: '/client', desc: 'Jean-Paul (A-204) — Rent, inventory & issues' },
    { role: 'operations', label: 'Operations Manager', icon: <Building className="w-4 h-4" />, path: '/operations', desc: 'Bookings, payments, preventive, meters & HR' },
    { role: 'owner', label: 'Property Owner', icon: <Crown className="w-4 h-4" />, path: '/owner', desc: 'Executive portfolio BI, ROI & smart alerts' },
    { role: 'household', label: 'Household Staff', icon: <Wrench className="w-4 h-4" />, path: '/household', desc: 'Inspection checklists & salary history' },
    { role: 'admin', label: 'System Admin', icon: <Shield className="w-4 h-4" />, path: '/admin', desc: 'Property CRUD, rental types & users' },
  ];

  const handleRoleChange = (role: UserRole, targetPath: string) => {
    switchRole(role);
    setIsOpen(false);
    
    // Only navigate if not already under that route prefix
    const currentPrefix = `/${location.pathname.split('/')[1] || ''}`;
    const targetPrefix = `/${targetPath.split('/')[1] || ''}`;
    
    if (currentPrefix !== targetPrefix || targetPath === '/') {
      navigate(targetPath);
    }
  };

  const activeRoleObj = roles.find((r) => r.role === currentRole) || roles[2];

  return (
    <div className="relative inline-block text-left z-40">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 text-white dark:bg-brand-950/80 dark:border-brand-700/60 border border-slate-700/60 shadow-md hover:bg-slate-800 transition-all text-xs font-medium"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="opacity-75 hidden sm:inline">Role:</span>
        <span className="font-bold flex items-center gap-1.5 text-brand-300">
          {activeRoleObj.icon}
          {activeRoleObj.label}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 origin-top-right rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-40 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/80 mb-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Switch Role Persona (Demo Mode)
              </p>
              {currentUser && (
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-0.5 truncate">
                  Logged as: <span className="font-semibold text-brand-600 dark:text-brand-400">{currentUser.name}</span>
                </p>
              )}
            </div>

            <div className="space-y-1">
              {roles.map((r) => {
                const isActive = r.role === currentRole;
                return (
                  <button
                    key={r.role}
                    onClick={() => handleRoleChange(r.role, r.path)}
                    className={`w-full text-left flex items-start gap-3 p-2.5 rounded-xl transition-all ${
                      isActive
                        ? 'bg-brand-50 text-brand-900 dark:bg-brand-950/60 dark:text-brand-200 font-semibold border border-brand-200 dark:border-brand-800/60'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg mt-0.5 ${
                        isActive
                          ? 'bg-brand-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {r.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{r.label}</span>
                        {isActive && <span className="text-[10px] bg-brand-500 text-white px-1.5 py-0.5 rounded-md">Active</span>}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 leading-tight">
                        {r.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
