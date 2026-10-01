import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Building2, Search, Sun, Moon, LogIn, Phone, Mail, MapPin, Compass, ShieldCheck, CheckCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { RoleSwitcher } from '../components/common/RoleSwitcher';

export const PublicLayout: React.FC = () => {
  const { resolvedTheme, toggleTheme } = useTheme();
  const { currentRole, switchRole } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0a0f1d] text-slate-900 dark:text-slate-100">
      {/* Top Banner Notice */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 border-b border-slate-800 flex items-center justify-between">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 hidden sm:inline">
              Luxury Serviced Apartments in Kigali — Kimihurura, Nyarutarama & Gacuriro
            </span>
            <span className="text-slate-300 sm:hidden">Panther Living Kigali</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1 text-slate-300">
              <Phone className="w-3.5 h-3.5 text-brand-400" />
              +250 788 123 456
            </span>
            <RoleSwitcher />
          </div>
        </div>
      </div>

      {/* Main Navigation Header */}
      <header className="sticky top-0 z-30 glass border-b border-slate-200/80 dark:border-slate-800/80 shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-700 via-brand-500 to-sky-400 flex items-center justify-center text-white shadow-glow group-hover:scale-105 transition-transform">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-extrabold font-display tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                PANTHER <span className="text-brand-500 font-semibold text-sm px-1.5 py-0.5 rounded bg-brand-50 dark:bg-brand-950/80 border border-brand-200 dark:border-brand-800/60">LIVING</span>
              </span>
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 -mt-0.5">
                Prime Kigali Residences
              </p>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <Link to="/" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
              Home
            </Link>
            <Link to="/properties" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors flex items-center gap-1">
              <Compass className="w-4 h-4 text-brand-500" />
              Explore Residences
            </Link>
            <a href="#amenities" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
              Amenities
            </a>
            <a href="#locations" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
              Neighborhoods
            </a>
          </nav>

          {/* Right Action buttons */}
          <div className="flex items-center gap-3">
            {/* Theme Switcher */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Toggle Theme"
            >
              {resolvedTheme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Portal login or Dashboard Button */}
            {currentRole === 'public' ? (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold shadow-md hover:shadow-glow transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>Resident / Staff Portal</span>
              </Link>
            ) : (
              <button
                onClick={() => {
                  if (currentRole === 'client') navigate('/client');
                  else if (currentRole === 'operations') navigate('/operations');
                  else if (currentRole === 'owner') navigate('/owner');
                  else if (currentRole === 'household') navigate('/household');
                  else navigate('/admin');
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-brand-600 dark:hover:bg-brand-700 text-sm font-bold shadow-md transition-all"
              >
                <span>Go to Dashboard</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Page Body */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* High-End Luxury Footer */}
      <footer className="bg-slate-950 text-slate-400 pt-16 pb-12 border-t border-slate-800 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800/80">
            {/* Brand column */}
            <div className="space-y-4 md:col-span-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white">
                  <Building2 className="w-5 h-5" />
                </div>
                <span className="text-xl font-extrabold font-display text-white tracking-tight">
                  PANTHER <span className="text-brand-400 font-semibold text-sm">LIVING</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Kigali’s premier apartment operations & luxury rental management company. Providing turnkey furnished and self-furnished residences with 24/7 security, high-speed fiber and dedicated maintenance.
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Certified Property Management Firm</span>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Explore Portfolios</h4>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <Link to="/properties" className="hover:text-white transition-colors">
                    Kigali Heights Residences (Kimihurura)
                  </Link>
                </li>
                <li>
                  <Link to="/properties" className="hover:text-white transition-colors">
                    Nyarutarama Golf View Lofts
                  </Link>
                </li>
                <li>
                  <Link to="/properties" className="hover:text-white transition-colors">
                    Gacuriro Vista Hillside Suites
                  </Link>
                </li>
                <li>
                  <Link to="/properties" className="hover:text-white transition-colors">
                    Vision City Executive Villas
                  </Link>
                </li>
                <li>
                  <Link to="/properties" className="hover:text-white transition-colors">
                    Kiyovu Crest Terraces
                  </Link>
                </li>
              </ul>
            </div>

            {/* Services */}
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Rental Configurations</h4>
              <ul className="space-y-2.5 text-xs">
                <li className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-brand-400" />
                  Fully Furnished Turnkey Suites
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-brand-400" />
                  Self-Furnished Long-Term Leases
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-brand-400" />
                  Executive Diplomatic Housing
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-brand-400" />
                  Preventive Facility Maintenance
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-brand-400" />
                  Online Tenant Portal & Metering
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Contact & Headquarters</h4>
              <div className="space-y-3 text-xs">
                <p className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                  <span>KG 7 Ave, Kigali Heights Tower, 4th Floor, Gasabo, Kigali, Rwanda</span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-brand-400 shrink-0" />
                  <span>+250 788 123 456 / +250 788 999 888</span>
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-brand-400 shrink-0" />
                  <span>concierge@panther.rw</span>
                </p>
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <p>© 2026 Panther Living Ltd. All rights reserved. Registered Real Estate Property Management System.</p>
            <div className="flex items-center gap-6">
              <span>Privacy Policy</span>
              <span>Terms of Tenancy</span>
              <span>Preventive Standards</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
