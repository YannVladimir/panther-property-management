import React, { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import {
  Search,
  LayoutGrid,
  List,
  MapPin,
  Building,
  SlidersHorizontal,
  ArrowRight,
  Sparkles,
  Check,
  DoorOpen,
  Filter,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export const PropertiesPage: React.FC = () => {
  const { properties, rooms } = useData();
  const [searchParams] = useSearchParams();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedLocation, setSelectedLocation] = useState(searchParams.get('location') || 'All');
  const [selectedFurnishing, setSelectedFurnishing] = useState(searchParams.get('rentalType') || 'All');
  const [selectedBedrooms, setSelectedBedrooms] = useState(searchParams.get('bedrooms') || 'All');
  const [maxPrice, setMaxPrice] = useState(Number(searchParams.get('maxPrice')) || 3000);
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      const propRooms = rooms.filter((r) => r.propertyId === p.id);
      const availableRooms = propRooms.filter((r) => r.status === 'available');

      if (onlyAvailable && availableRooms.length === 0) return false;

      if (selectedLocation !== 'All' && !p.location.toLowerCase().includes(selectedLocation.toLowerCase())) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesLocation = p.location.toLowerCase().includes(q);
        const matchesDesc = p.description.toLowerCase().includes(q);
        if (!matchesName && !matchesLocation && !matchesDesc) return false;
      }

      // Check if any room matches price and bedroom filter
      if (selectedBedrooms !== 'All') {
        const hasBedroom = propRooms.some((r) => r.bedrooms.toString() === selectedBedrooms);
        if (!hasBedroom) return false;
      }

      const hasPrice = propRooms.some((r) => r.monthlyRent <= maxPrice);
      if (!hasPrice) return false;

      return true;
    });
  }, [properties, rooms, selectedLocation, selectedFurnishing, selectedBedrooms, maxPrice, searchQuery, onlyAvailable]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Panther Real Estate Catalog
          </span>
          <h1 className="text-3xl font-extrabold font-display text-slate-900 dark:text-white mt-1">
            Explore Apartments & Residences
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Browse premium managed residences in Gacuriro Hillcrest & Nyarutarama Golf View.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">Grid</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'list'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">List</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 sm:p-5 rounded-2xl shadow-soft space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-center">
          {/* Search Query */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by name or neighborhood..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Location */}
          <div>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            >
              <option value="All">All Locations</option>
              <option value="Nyarutarama">Nyarutarama (Golf View)</option>
              <option value="Gacuriro">Gacuriro (Hillcrest)</option>
            </select>
          </div>

          {/* Bedrooms */}
          <div>
            <select
              value={selectedBedrooms}
              onChange={(e) => setSelectedBedrooms(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            >
              <option value="All">All Bedrooms</option>
              <option value="1">1 Bedroom</option>
              <option value="2">2 Bedrooms</option>
              <option value="3">3 Bedrooms</option>
              <option value="4">4+ Bedrooms</option>
            </select>
          </div>

          {/* Max Price Slider */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
              <span>Max Monthly:</span>
              <span className="text-brand-600 dark:text-brand-400 font-bold">${maxPrice}/mo</span>
            </div>
            <input
              type="range"
              min="500"
              max="3000"
              step="50"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-brand-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
          </div>

          {/* Available toggle */}
          <div className="flex items-center">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(e) => setOnlyAvailable(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
              />
              <span>Only show available units</span>
            </label>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <p>Showing <span className="font-bold text-slate-900 dark:text-white">{filteredProperties.length}</span> properties</p>
      </div>

      {/* Properties Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProperties.map((prop) => {
            const propRooms = rooms.filter((r) => r.propertyId === prop.id);
            const availableRooms = propRooms.filter((r) => r.status === 'available');
            const minPrice = Math.min(...propRooms.map((r) => r.monthlyRent));

            return (
              <div
                key={prop.id}
                className="glass-card rounded-3xl overflow-hidden shadow-soft hover:shadow-premium hover:-translate-y-1 transition-all duration-300 flex flex-col group"
              >
                <div className="relative h-60 overflow-hidden">
                  <img
                    src={prop.images[0]}
                    alt={prop.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 flex gap-2">
                    <Badge variant="purple" size="sm">★ {prop.rating}</Badge>
                    {availableRooms.length > 0 ? (
                      <Badge variant="available" size="sm">{availableRooms.length} Available</Badge>
                    ) : (
                      <Badge variant="occupied" size="sm">Full</Badge>
                    )}
                  </div>
                  <div className="absolute bottom-4 right-4 bg-slate-950/80 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-xl">
                    From ${minPrice}/mo
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                      <span>{prop.location}</span>
                    </div>
                    <h3 className="text-xl font-bold font-display text-slate-900 dark:text-white mt-1 group-hover:text-brand-600 transition-colors">
                      {prop.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed">
                      {prop.description}
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                      <span>Total Units: <strong>{prop.totalRooms}</strong></span>
                      <span>Occupancy: <strong>{Math.round((prop.occupiedRooms / prop.totalRooms) * 100)}%</strong></span>
                    </div>

                    <Link
                      to={`/property/${prop.id}`}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-brand-600 hover:bg-brand-600 text-white text-xs font-bold transition-colors"
                    >
                      <span>View Residence & Rooms</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProperties.map((prop) => {
            const propRooms = rooms.filter((r) => r.propertyId === prop.id);
            const availableRooms = propRooms.filter((r) => r.status === 'available');
            const minPrice = Math.min(...propRooms.map((r) => r.monthlyRent));

            return (
              <div
                key={prop.id}
                className="glass-card p-4 sm:p-5 rounded-2xl shadow-soft hover:shadow-premium transition-all flex flex-col sm:flex-row gap-6 items-center"
              >
                <img
                  src={prop.images[0]}
                  alt={prop.name}
                  className="w-full sm:w-56 h-40 object-cover rounded-xl shrink-0"
                />
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="purple" size="sm">★ {prop.rating}</Badge>
                    {availableRooms.length > 0 ? (
                      <Badge variant="available" size="sm">{availableRooms.length} Available</Badge>
                    ) : (
                      <Badge variant="occupied" size="sm">Full</Badge>
                    )}
                  </div>
                  <h3 className="text-xl font-bold font-display text-slate-900 dark:text-white">
                    {prop.name}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-brand-500" />
                    {prop.location} • {prop.address}
                  </p>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {prop.description}
                  </p>
                </div>

                <div className="sm:text-right shrink-0 space-y-3 w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-xs text-slate-400">Starting from</span>
                    <p className="text-2xl font-extrabold font-display text-brand-600 dark:text-brand-400">
                      ${minPrice}<span className="text-xs text-slate-500 font-normal">/mo</span>
                    </p>
                  </div>
                  <Link
                    to={`/property/${prop.id}`}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-brand-600 hover:bg-brand-600 text-white text-xs font-bold transition-colors w-full sm:w-auto"
                  >
                    <span>View Property</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
