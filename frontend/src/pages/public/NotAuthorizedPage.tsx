import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export const NotAuthorizedPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 gap-4">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-500">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Not authorized</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
        Your account doesn't have access to this section. If you think this is a mistake, contact
        your administrator.
      </p>
      <Link
        to="/"
        className="mt-2 inline-flex items-center px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold shadow-md transition-all"
      >
        Return Home
      </Link>
    </div>
  );
};
