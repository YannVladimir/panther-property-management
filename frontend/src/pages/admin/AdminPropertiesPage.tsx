import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import {
  Building,
  Plus,
  Edit,
  Trash2,
  MapPin,
  CheckCircle2,
  Search,
  Image,
  Eye,
  Settings,
  Sparkles,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Pagination } from '../../components/common/Pagination';

export const AdminPropertiesPage: React.FC = () => {
  const { properties } = useData();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredProperties = useMemo(() => properties.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.location.toLowerCase().includes(searchQuery.toLowerCase())
  ), [properties, searchQuery]);

  const pagedProperties = useMemo(() => {
    const start = (pageIndex - 1) * pageSize;
    return filteredProperties.slice(start, start + pageSize);
  }, [filteredProperties, pageIndex, pageSize]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 px-2.5 py-1 rounded-full border border-brand-200 dark:border-brand-800 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Estate Management & Public Catalog</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 dark:text-white">
            Properties & Estates CRUD
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure estate marketing details, GPS location, photos, and amenities that feed the public website.
          </p>
        </div>

        <button
          onClick={() => navigate('/admin/properties/new')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md hover:shadow-glow transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Estate</span>
        </button>
      </div>

      {/* Search */}
      <div className="glass-card p-4 rounded-2xl shadow-soft">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search properties by name or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
          />
        </div>
      </div>

      {/* Properties Table */}
      <div className="glass-card rounded-3xl shadow-soft overflow-hidden border">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold text-[10px] bg-slate-50/50 dark:bg-slate-800/30">
                <th className="py-3.5 px-6">Property Name</th>
                <th className="py-3.5 px-4">Code</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Total Rooms</th>
                <th className="py-3.5 px-4">Occupied</th>
                <th className="py-3.5 px-4">Available</th>
                <th className="py-3.5 px-4">Rating</th>
                <th className="py-3.5 px-6 text-right">Configure & Public Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {pagedProperties.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <img src={p.images[0]} alt={p.name} className="w-14 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700" />
                      <div>
                        <Link
                          to={`/admin/properties/${p.id}`}
                          className="font-bold text-slate-900 dark:text-white hover:text-brand-600 transition-colors"
                        >
                          {p.name}
                        </Link>
                        <p className="text-[10px] text-slate-400">{p.neighborhood}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 font-mono font-bold text-brand-600 dark:text-brand-400">{p.code}</td>
                  <td className="py-4 px-4 font-medium">{p.location}</td>
                  <td className="py-4 px-4 font-bold">{p.totalRooms} Units</td>
                  <td className="py-4 px-4 font-bold text-emerald-600">{p.occupiedRooms}</td>
                  <td className="py-4 px-4 font-bold text-sky-600">{p.availableRooms}</td>
                  <td className="py-4 px-4">
                    <Badge variant="purple" size="sm">★ {p.rating}</Badge>
                  </td>
                  <td className="py-4 px-6 text-right space-x-2">
                    <Link
                      to={`/property/${p.id}`}
                      target="_blank"
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                      title="Preview on Public Website"
                    >
                      <Eye className="w-3.5 h-3.5 text-brand-500" />
                      <span>Public</span>
                    </Link>
                    <Link
                      to={`/admin/properties/${p.id}`}
                      className="px-3 py-1.5 rounded-lg bg-brand-50 dark:bg-brand-950/60 hover:bg-brand-100 text-brand-700 dark:text-brand-300 text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Configure</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={pageIndex}
          totalItems={filteredProperties.length}
          pageSize={pageSize}
          onPageChange={(p) => setPageIndex(p)}
          onPageSizeChange={(s) => { setPageSize(s); setPageIndex(1); }}
        />
      </div>
    </div>
  );
};

