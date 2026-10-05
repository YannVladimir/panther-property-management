import React, { useEffect, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { ApiError } from '../../api/client';
import { useSystemSettingsQuery, useUpdateSystemSettingsMutation } from '../../api/systemSettings';
import {
  Settings,
  Shield,
  DollarSign,
  Globe,
  Database,
  Save,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';

/** The frontend previously showed a display string ("USD ($)"); the backend persists a plain ISO
 * currency code ("USD"). Two-way map since these don't reduce to a case transform. */
const CURRENCY_TO_FRONTEND: Record<string, string> = { USD: 'USD ($)', RWF: 'RWF (Frw)' };
const CURRENCY_TO_BACKEND: Record<string, string> = { 'USD ($)': 'USD', 'RWF (Frw)': 'RWF' };

export const AdminSystemSettingsPage: React.FC = () => {
  const { success, error } = useToast();
  const settingsQuery = useSystemSettingsQuery();
  const updateSettingsMutation = useUpdateSystemSettingsMutation();

  const [companyName, setCompanyName] = useState('');
  const [currency, setCurrency] = useState('USD ($)');
  const [waterRate, setWaterRate] = useState(0);
  const [commissionRate, setCommissionRate] = useState(0);
  const [vatTaxRate, setVatTaxRate] = useState(0);

  useEffect(() => {
    const s = settingsQuery.data;
    if (!s) return;
    setCompanyName(s.companyName);
    setCurrency(CURRENCY_TO_FRONTEND[s.currencyCode] ?? s.currencyCode);
    setWaterRate(s.waterRatePerM3);
    setCommissionRate(s.defaultAgentCommissionPct);
    setVatTaxRate(s.vatTaxRatePct);
  }, [settingsQuery.data]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettingsMutation.mutateAsync({
        companyName,
        currencyCode: CURRENCY_TO_BACKEND[currency] ?? currency,
        waterRatePerM3: waterRate,
        defaultAgentCommissionPct: commissionRate,
        vatTaxRatePct: vatTaxRate,
      });
      success('System Settings Saved', 'Global platform parameters updated successfully.');
    } catch (err) {
      error('Save Failed', err instanceof ApiError ? err.message : 'Could not save system settings.');
    }
  };

  if (settingsQuery.isLoading) {
    return <div className="py-24 text-center text-sm text-slate-400">Loading system settings…</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200 dark:border-slate-800">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
          Global System Configurations
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 dark:text-white mt-1">
          System Parameters & Business Rules
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Configure multi-currency rates, WASAC water pricing, default broker commissions, and tax rules.
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6 text-xs">
        {/* Company & Localization */}
        <div className="glass-card p-6 sm:p-7 rounded-3xl shadow-soft space-y-4">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Branding & Localization
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Company Brand Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Primary Billing Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              >
                <option value="USD ($)">USD ($) — United States Dollar</option>
                <option value="RWF (Frw)">RWF (Frw) — Rwandan Franc</option>
              </select>
            </div>
          </div>
        </div>

        {/* Operational Rate Parameters */}
        <div className="glass-card p-6 sm:p-7 rounded-3xl shadow-soft space-y-4">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Tariffs, Submetering & Broker Rates
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Water Utility Rate ($ / m³)
              </label>
              <input
                type="number"
                step="0.05"
                value={waterRate}
                onChange={(e) => setWaterRate(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Default Agent Commission (%)
              </label>
              <input
                type="number"
                value={commissionRate}
                onChange={(e) => setCommissionRate(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Statutory VAT Rate (%)
              </label>
              <input
                type="number"
                value={vatTaxRate}
                onChange={(e) => setVatTaxRate(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>Save System Parameters</span>
        </button>
      </form>
    </div>
  );
};
