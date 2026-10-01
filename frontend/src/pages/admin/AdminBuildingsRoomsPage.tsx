import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import {
  DoorOpen,
  Building,
  Plus,
  Search,
  Layers,
  Settings,
  Eye,
  Sparkles,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Pagination } from '../../components/common/Pagination';

export const AdminBuildingsRoomsPage: React.FC = () => {
  const { rooms, properties } = useData();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPropertyFilter, setSelectedPropertyFilter] = useState<string>('all');
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredRooms = useMemo(() => rooms.filter((r) => {
    if (selectedPropertyFilter !== 'all' && r.propertyId !== selectedPropertyFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.roomNumber.toLowerCase().includes(q) ||
        r.propertyName.toLowerCase().includes(q) ||
        r.furnishingType.toLowerCase().includes(q)
      );
    }
    return true;
  }), [rooms, selectedPropertyFilter, searchQuery]);

  const pagedRooms = useMemo(() => {
    const start = (pageIndex - 1) * pageSize;
    return filteredRooms.slice(start, start + pageSize);
  }, [filteredRooms, pageIndex, pageSize]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 px-2.5 py-1 rounded-full border border-brand-200 dark:border-brand-800 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Unit Master & Public Availability Matrix</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 dark:text-white">
            Buildings & Rooms Inventory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure unit pricing, photo galleries, furnishing tiers, and live availability displayed on the public site.
          </p>
        </div>

        <button
          onClick={() => navigate('/admin/buildings-rooms/new')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md hover:shadow-glow transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Unit</span>
        </button>
      </div>

      {/* Search & Property Filter */}
      <div className="glass-card p-4 rounded-2xl shadow-soft flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by suite number, estate, or furnishing tier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
          />
        </div>

        <div className="sm:w-64">
          <select
            value={selectedPropertyFilter}
            onChange={(e) => setSelectedPropertyFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
          >
            <option value="all">All Properties ({properties.length})</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Rooms Table */}
      <div className="glass-card rounded-3xl shadow-soft overflow-hidden border">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
            Configured Suites & Apartments ({filteredRooms.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold text-[10px] bg-slate-50/50 dark:bg-slate-800/30">
                <th className="py-3.5 px-6">Unit / Suite</th>
                <th className="py-3.5 px-4">Estate Property</th>
                <th className="py-3.5 px-4">Floor & Size</th>
                <th className="py-3.5 px-4">Layout</th>
                <th className="py-3.5 px-4">Furnishing Tier</th>
                <th className="py-3.5 px-4">Monthly Rent</th>
                <th className="py-3.5 px-4">Availability</th>
                <th className="py-3.5 px-6 text-right">Configure & Public Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {pagedRooms.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <img
                        src={r.images[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=200'}
                        alt={r.roomNumber}
                        className="w-12 h-9 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                      />
                      <div>
                        <Link
                          to={`/admin/buildings-rooms/${r.id}`}
                          className="font-extrabold font-mono text-slate-900 dark:text-white hover:text-brand-600 transition-colors"
                        >
                          Unit {r.roomNumber}
                        </Link>
                        <p className="text-[10px] text-slate-400">{r.buildingName || 'Main Wing'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 font-bold text-slate-900 dark:text-white">{r.propertyName}</td>
                  <td className="py-4 px-4">
                    <span className="font-medium">Floor {r.floor}</span> • <span className="font-bold">{r.sizeSqM} m²</span>
                  </td>
                  <td className="py-4 px-4">{r.bedrooms} Bed / {r.bathrooms} Bath</td>
                  <td className="py-4 px-4">
                    <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                      {r.furnishingType}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-extrabold text-brand-600 dark:text-brand-400 font-mono text-sm">
                    ${r.monthlyRent}
                  </td>
                  <td className="py-4 px-4">
                    <Badge
                      variant={
                        r.status === 'available'
                          ? 'success'
                          : r.status === 'occupied'
                          ? 'danger'
                          : r.status === 'reserved'
                          ? 'warning'
                          : 'info'
                      }
                      size="sm"
                      dot
                    >
                      {r.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-4 px-6 text-right space-x-2">
                    <Link
                      to={`/room/${r.id}`}
                      target="_blank"
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                      title="Preview on Public Room Page"
                    >
                      <Eye className="w-3.5 h-3.5 text-brand-500" />
                      <span>Public</span>
                    </Link>
                    <Link
                      to={`/admin/buildings-rooms/${r.id}`}
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
          totalItems={filteredRooms.length}
          pageSize={pageSize}
          onPageChange={(p) => setPageIndex(p)}
          onPageSizeChange={(s) => { setPageSize(s); setPageIndex(1); }}
        />
      </div>
    </div>
  );
};
