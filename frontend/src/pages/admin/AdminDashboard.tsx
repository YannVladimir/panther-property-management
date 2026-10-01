import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import {
  Shield,
  Building,
  DoorOpen,
  Users,
  Layers,
  Settings,
  History,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Database,
  Server,
  Sparkles,
} from 'lucide-react';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';

export const AdminDashboard: React.FC = () => {
  const { properties, rooms, clients, rentalTypes } = useData();
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 text-xs font-bold mb-1 border border-purple-200 dark:border-purple-800/60">
            <Shield className="w-3.5 h-3.5" />
            System Administration & Schema Master
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 dark:text-white">
            Admin Master Console
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure estate portfolios, room inventories, modular furnishing packages, users & permissions.
          </p>
        </div>
      </div>

      {/* Admin KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Managed Estates"
          value={`${properties.length} Estates`}
          subtitle="5 Kigali locations"
          icon={Building}
          accentColor="brand"
          onClick={() => navigate('/admin/properties')}
        />
        <StatCard
          title="Total Room Inventory"
          value={`${rooms.length} Units`}
          subtitle="Active database records"
          icon={DoorOpen}
          accentColor="emerald"
          onClick={() => navigate('/admin/buildings-rooms')}
        />
        <StatCard
          title="Rental Configurations"
          value={`${rentalTypes.length} Tiers`}
          subtitle="Configurable furnishing types"
          icon={Layers}
          accentColor="purple"
          onClick={() => navigate('/admin/rental-types')}
        />
        <StatCard
          title="System Users"
          value="5 Accounts"
          subtitle="RBAC role guards active"
          icon={Users}
          accentColor="sky"
          onClick={() => navigate('/admin/users')}
        />
      </div>

      {/* Admin Quick Action Modules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          onClick={() => navigate('/admin/properties')}
          className="glass-card p-6 rounded-3xl shadow-soft space-y-3 cursor-pointer hover:border-brand-500 transition-all"
        >
          <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-600 flex items-center justify-center">
            <Building className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Properties CRUD</h3>
          <p className="text-xs text-slate-500">
            Create, edit and manage Kigali residential estates, GPS addresses, amenities, and photo galleries.
          </p>
          <span className="text-xs font-bold text-brand-600 flex items-center gap-1">
            Manage Properties <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>

        <div
          onClick={() => navigate('/admin/rental-types')}
          className="glass-card p-6 rounded-3xl shadow-soft space-y-3 cursor-pointer hover:border-purple-500 transition-all"
        >
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Rental & Furnishing Types</h3>
          <p className="text-xs text-slate-500">
            Configure dynamic furnishing configurations, price multipliers, and default assigned furniture lists.
          </p>
          <span className="text-xs font-bold text-purple-600 flex items-center gap-1">
            Configure Types <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>

        <div
          onClick={() => navigate('/admin/users')}
          className="glass-card p-6 rounded-3xl shadow-soft space-y-3 cursor-pointer hover:border-emerald-500 transition-all"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Users & Permissions</h3>
          <p className="text-xs text-slate-500">
            Manage access credentials, assign roles (Client, Operations, Owner, Household, Admin), and audit activity.
          </p>
          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
            Manage Users <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
};
