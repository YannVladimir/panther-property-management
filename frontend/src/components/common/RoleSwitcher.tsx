import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { UserRole } from '../../types';
import { Shield, User, Building, Crown, Wrench, ChevronDown } from 'lucide-react';

/** Dev-only quick login — real accounts, real JWT auth, all share the password@123 password. */
const DEMO_PASSWORD = 'password@123';

const ROLE_META: Record<UserRole, { icon: React.ReactNode; path: string }> = {
  public: { icon: null, path: '/' },
  client: { icon: <User className="w-4 h-4" />, path: '/client' },
  operations: { icon: <Building className="w-4 h-4" />, path: '/operations' },
  owner: { icon: <Crown className="w-4 h-4" />, path: '/owner' },
  household: { icon: <Wrench className="w-4 h-4" />, path: '/household' },
  admin: { icon: <Shield className="w-4 h-4" />, path: '/admin' },
};

export const RoleSwitcher: React.FC = () => {
  const { currentRole, currentUser, demoAccounts, login } = useAuth();
  const { error } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  if (!import.meta.env.DEV) return null;

  const handleQuickLogin = async (email: string, targetPath: string) => {
    setSwitching(true);
    try {
      await login(email, DEMO_PASSWORD);
      setIsOpen(false);
      const currentPrefix = `/${location.pathname.split('/')[1] || ''}`;
      const targetPrefix = `/${targetPath.split('/')[1] || ''}`;
      if (currentPrefix !== targetPrefix) navigate(targetPath);
    } catch {
      error('Quick login failed', 'Could not sign in as that demo account.');
    } finally {
      setSwitching(false);
    }
  };

  const activeMeta = ROLE_META[currentRole] ?? ROLE_META.operations;

  return (
    <div className="relative inline-block text-left z-40">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={switching}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 text-white dark:bg-brand-950/80 dark:border-brand-700/60 border border-slate-700/60 shadow-md hover:bg-slate-800 transition-all text-xs font-medium disabled:opacity-50"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="opacity-75 hidden sm:inline">Dev quick login:</span>
        <span className="font-bold flex items-center gap-1.5 text-brand-300">
          {activeMeta.icon}
          {currentUser ? currentUser.name : 'Not logged in'}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 origin-top-right rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-40 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/80 mb-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Dev-only — real login, shared demo password
              </p>
              {currentUser && (
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-0.5 truncate">
                  Logged in as: <span className="font-semibold text-brand-600 dark:text-brand-400">{currentUser.name}</span>
                </p>
              )}
            </div>

            <div className="space-y-1">
              {demoAccounts.map((demo) => {
                const meta = ROLE_META[demo.role];
                const isActive = demo.role === currentRole;
                return (
                  <button
                    key={demo.role}
                    disabled={switching}
                    onClick={() => handleQuickLogin(demo.email, meta.path)}
                    className={`w-full text-left flex items-start gap-3 p-2.5 rounded-xl transition-all disabled:opacity-50 ${
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
                      {meta.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{demo.label}</span>
                        {isActive && <span className="text-[10px] bg-brand-500 text-white px-1.5 py-0.5 rounded-md">Active</span>}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 leading-tight">
                        {demo.description}
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
