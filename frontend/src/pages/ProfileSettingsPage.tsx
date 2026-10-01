import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import {
  User,
  Sun,
  Moon,
  Monitor,
  Bell,
  Lock,
  Save,
  CheckCircle2,
  Shield,
} from 'lucide-react';
import { Badge } from '../components/common/Badge';

export const ProfileSettingsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const { success } = useToast();

  const [name, setName] = useState(currentUser ? currentUser.name : 'Resident / Staff');
  const [email, setEmail] = useState(currentUser ? currentUser.email : 'user@panther.rw');
  const [phone, setPhone] = useState(currentUser?.phone || '+250 788 123 456');

  const [emailNotifs, setEmailNotifs] = useState(true);
  const [smsNotifs, setSmsNotifs] = useState(true);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    success('Profile Saved', 'Personal preferences and contact info updated.');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200 dark:border-slate-800">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
          Preferences & Security
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 dark:text-white mt-1">
          Profile & Account Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Customize your theme interface, contact credentials, and notification settings.
        </p>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-6 text-xs">
        {/* Profile Card */}
        <div className="glass-card p-6 sm:p-7 rounded-3xl shadow-soft space-y-5">
          <div className="flex items-center gap-4">
            {currentUser && (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-brand-500"
              />
            )}
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{name}</h3>
              <p className="text-xs text-brand-600 dark:text-brand-400 font-semibold capitalize">
                {currentUser?.role} Mode
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Full Legal Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Phone Number (WhatsApp)
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Theme Settings (Light / Dark / System) */}
        <div className="glass-card p-6 sm:p-7 rounded-3xl shadow-soft space-y-4">
          <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
            Interface Theme & Appearance
          </h3>
          <p className="text-slate-500">
            Switch between Light, Dark, or System preference. Changes are instantly saved locally.
          </p>

          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-4 rounded-2xl border flex flex-col items-center gap-2 font-bold transition-all ${
                theme === 'light'
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Sun className="w-5 h-5 text-amber-500" />
              <span>Light Mode</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-2xl border flex flex-col items-center gap-2 font-bold transition-all ${
                theme === 'dark'
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Moon className="w-5 h-5 text-indigo-400" />
              <span>Dark Mode</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('system')}
              className={`p-4 rounded-2xl border flex flex-col items-center gap-2 font-bold transition-all ${
                theme === 'system'
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Monitor className="w-5 h-5 text-slate-400" />
              <span>System Default</span>
            </button>
          </div>
        </div>

        {/* Notifications Preference */}
        <div className="glass-card p-6 sm:p-7 rounded-3xl shadow-soft space-y-4">
          <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
            Notifications & Dispatch Alerts
          </h3>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 cursor-pointer">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Email Invoices & Statements</p>
                <p className="text-[11px] text-slate-500">Receive monthly rent receipts and payment confirmations</p>
              </div>
              <input
                type="checkbox"
                checked={emailNotifs}
                onChange={(e) => setEmailNotifs(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 cursor-pointer">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">SMS Maintenance Updates</p>
                <p className="text-[11px] text-slate-500">Receive real-time contractor dispatch notices via SMS</p>
              </div>
              <input
                type="checkbox"
                checked={smsNotifs}
                onChange={(e) => setSmsNotifs(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
              />
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>Save Account Preferences</span>
        </button>
      </form>
    </div>
  );
};
