import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Building2,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { UserRole } from '../../types';
import { ApiError } from '../../api/client';

const ROLE_HOME: Record<UserRole, string> = {
  public: '/',
  client: '/client',
  operations: '/operations',
  owner: '/owner',
  household: '/household',
  admin: '/admin',
};

export const LoginPage: React.FC = () => {
  const { login, demoAccounts } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      success('Welcome Back!', 'Logged in successfully.');
      navigate('/operations');
    } catch (err) {
      setFormError(
        err instanceof ApiError && err.status === 401
          ? 'Incorrect email or password.'
          : 'Something went wrong. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemoLogin = async (role: UserRole) => {
    const demo = demoAccounts.find((d) => d.role === role);
    if (!demo) return;
    setFormError(null);
    setSubmitting(true);
    try {
      await login(demo.email, 'password@123');
      success(`Logged in as ${demo.label}`, `Active persona: ${demo.email}`);
      navigate(ROLE_HOME[role]);
    } catch {
      setFormError('Quick demo login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full space-y-8">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-700 via-brand-500 to-sky-400 items-center justify-center text-white shadow-glow mb-2">
            <Building2 className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-extrabold font-display text-slate-900 dark:text-white tracking-tight">
            Panther Living Portal
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sign in to access resident services, operations or management analytics
          </p>
        </div>

        {/* Login Form Card */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl shadow-premium space-y-6">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-semibold">
              {formError}
            </div>
          )}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. operations@panther.rw"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end text-xs">
              <a href="#forgot" className="text-brand-600 dark:text-brand-400 font-bold hover:underline">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <span>{submitting ? 'Signing in…' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Dev-only quick demo login — real accounts, real password (password@123) */}
          {import.meta.env.DEV && (
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                Dev Quick Login
              </span>
              <span className="text-[10px] text-slate-400">Real login, shared password</span>
            </div>

            <div className="space-y-2">
              {demoAccounts.map((demo) => (
                <button
                  key={demo.role}
                  type="button"
                  disabled={submitting}
                  onClick={() => handleQuickDemoLogin(demo.role)}
                  className="w-full text-left p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-brand-500 hover:bg-brand-50/50 dark:hover:bg-brand-950/40 transition-all flex items-center justify-between group disabled:opacity-50"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400">
                      {demo.label}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">{demo.email}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-500 transform group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>
          </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-500">
          Return to{' '}
          <Link to="/" className="font-bold text-brand-600 dark:text-brand-400 hover:underline">
            Public Website
          </Link>
        </p>
      </div>
    </div>
  );
};
