import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePropertiesQuery } from '../../api/properties';
import { useRoomsQuery } from '../../api/rooms';
import { useRentalTypesQuery } from '../../api/rentalTypes';
import {
  Search,
  MapPin,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Layers,
  Star,
  ShieldCheck,
  Wifi,
  Building,
  ChevronRight as ChevronRightIcon,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';

/* ─── Image Slider ─── */
const PropertyImageSlider: React.FC<{
  images: string[];
  name: string;
  autoPlay?: boolean;
}> = ({ images, name, autoPlay = true }) => {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => setCurrent((c) => (c + 1) % images.length), [images.length]);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + images.length) % images.length), [images.length]);

  useEffect(() => {
    if (!autoPlay || images.length <= 1) return;
    const t = setInterval(next, 4500);
    return () => clearInterval(t);
  }, [autoPlay, images.length, next]);

  return (
    <div className="relative w-full h-full overflow-hidden rounded-3xl group">
      {images.map((src, i) => (
        <img
          key={i}
          src={src}
          alt={`${name} — view ${i + 1}`}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-in-out ${
            i === current ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
          }`}
        />
      ))}

      {/* Navigation arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.preventDefault(); prev(); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-slate-950/60 hover:bg-slate-950/90 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg border border-white/10"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); next(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-slate-950/60 hover:bg-slate-950/90 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg border border-white/10"
            aria-label="Next image"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Dot indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.preventDefault(); setCurrent(i); }}
                className={`rounded-full transition-all duration-300 ${
                  i === current ? 'w-6 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80'
                }`}
                aria-label={`Go to image ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/* ─── Main Page ─── */
export const HomePage: React.FC = () => {
  const { data: properties = [] } = usePropertiesQuery();
  const { data: rooms = [] } = useRoomsQuery();
  const { data: rentalTypes = [] } = useRentalTypesQuery();
  const navigate = useNavigate();

  const [searchLocation, setSearchLocation] = useState('All');
  const [searchRentalType, setSearchRentalType] = useState('All');
  const [searchBedrooms, setSearchBedrooms] = useState('All');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/properties?location=${searchLocation}&rentalType=${searchRentalType}&bedrooms=${searchBedrooms}`);
  };

  const availableRoomsCount = rooms.filter((r) => r.status === 'available').length;

  return (
    <div className="space-y-28 pb-20">
      {/* ── Hero ── */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-12 pb-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&auto=format&fit=crop&q=80"
            alt="Kigali Luxury Residences"
            className="w-full h-full object-cover object-center scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/92 via-slate-950/80 to-slate-900/50" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white space-y-8">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold font-display tracking-tight leading-tight max-w-4xl mx-auto">
            Find a place that truly{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-sky-300 to-indigo-300">
              feels like home.
            </span>
          </h1>

          <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Experience fully serviced, turnkey furnished and self-furnished luxury apartments across Kigali's most prestigious residential quarters.
          </p>

          {/* Search Box */}
          <div className="max-w-4xl mx-auto mt-8 p-4 sm:p-6 rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-white/20 dark:border-slate-800 shadow-2xl text-slate-900 dark:text-white text-left">
            <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Location</label>
                <select
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:ring-2 focus:ring-brand-500"
                >
                  <option value="All">All Neighborhoods</option>
                  <option value="Nyarutarama">Nyarutarama (Golf View)</option>
                  <option value="Gacuriro">Gacuriro (Hillside)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Rental Type</label>
                <select
                  value={searchRentalType}
                  onChange={(e) => setSearchRentalType(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:ring-2 focus:ring-brand-500"
                >
                  <option value="All">All Furnishing Types</option>
                  <option value="Fully Furnished">Fully Furnished</option>
                  <option value="Self Furnished">Self Furnished</option>
                  <option value="Executive Luxury">Executive Luxury</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Bedrooms</label>
                <select
                  value={searchBedrooms}
                  onChange={(e) => setSearchBedrooms(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:ring-2 focus:ring-brand-500"
                >
                  <option value="All">Any Bedrooms</option>
                  <option value="1">1 Bedroom Studio</option>
                  <option value="2">2 Bedrooms Suite</option>
                  <option value="3">3 Bedrooms Luxury</option>
                  <option value="4">4+ Bedrooms Villa</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-lg hover:shadow-glow transition-all"
                >
                  <Search className="w-4 h-4" />
                  <span>Find Apartments</span>
                </button>
              </div>
            </form>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {availableRoomsCount} Turnkey Apartments
                </span>
                <span>Available for Immediate Move-in</span>
              </div>
              <Link to="/properties" className="text-brand-600 dark:text-brand-400 font-bold hover:underline flex items-center gap-1">
                Browse All Units <ChevronRightIcon className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured Properties — Alternating Split Layout ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 text-xs font-bold mb-4 border border-brand-200 dark:border-brand-800">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Our Flagship Residences</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold font-display text-slate-900 dark:text-white leading-tight">
            Two Exceptional Estates in Kigali
          </h2>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-3 max-w-2xl mx-auto">
            Directly managed luxury living in Gacuriro Hillcrest and Nyarutarama Golf View — each estate curated for refined modern comfort.
          </p>
        </div>

        <div className="space-y-24">
          {properties.map((prop, index) => {
            const propRooms = rooms.filter((r) => r.propertyId === prop.id);
            const availableInProp = propRooms.filter((r) => r.status === 'available').length;
            const minPrice = propRooms.length > 0 ? Math.min(...propRooms.map((r) => r.monthlyRent)) : 750;
            const isReversed = index % 2 === 1;

            return (
              <div
                key={prop.id}
                className={`flex flex-col ${isReversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-10 lg:gap-14 items-center`}
              >
                {/* Image Slider Side */}
                <div className="w-full lg:w-1/2 h-[380px] sm:h-[440px] lg:h-[520px] relative shadow-2xl rounded-3xl overflow-hidden">
                  <PropertyImageSlider images={prop.images} name={prop.name} />

                  {/* Overlay badges */}
                  <div className="absolute top-5 left-5 z-10 flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-md text-amber-400 text-xs font-bold px-3 py-1.5 rounded-full border border-amber-400/30">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      {prop.rating} ({prop.reviewCount} reviews)
                    </div>
                    {availableInProp > 0 ? (
                      <div className="flex items-center gap-1.5 bg-emerald-600/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        {availableInProp} Suites Available
                      </div>
                    ) : (
                      <div className="bg-red-600/80 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full">
                        Fully Booked
                      </div>
                    )}
                  </div>

                  {/* Price tag */}
                  <div className="absolute bottom-5 right-5 z-10 bg-slate-950/90 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl border border-white/10 shadow-xl">
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Starting from</p>
                    <p className="text-xl font-extrabold font-mono text-emerald-400">${minPrice}<span className="text-xs font-normal text-slate-300">/mo</span></p>
                  </div>
                </div>

                {/* Content Side */}
                <div className="w-full lg:w-1/2 space-y-6">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-brand-600 dark:text-brand-400 font-bold uppercase tracking-wider mb-2">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span>{prop.location} • {prop.neighborhood}</span>
                    </div>
                    <h3 className="text-3xl sm:text-4xl font-extrabold font-display text-slate-900 dark:text-white leading-tight">
                      {prop.name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
                      {prop.description}
                    </p>
                  </div>

                  {/* Key stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="glass-card p-4 rounded-2xl border text-center">
                      <p className="text-2xl font-extrabold text-brand-600 dark:text-brand-400">{prop.totalRooms}</p>
                      <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Total Suites</p>
                    </div>
                    <div className="glass-card p-4 rounded-2xl border text-center">
                      <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{availableInProp}</p>
                      <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Available</p>
                    </div>
                    <div className="glass-card p-4 rounded-2xl border text-center">
                      <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{prop.yearBuilt}</p>
                      <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Year Built</p>
                    </div>
                  </div>

                  {/* Amenities */}
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                      Key Amenities & Features
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {prop.amenities.map((amenity, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        >
                          <CheckCircle2 className="w-3 h-3 text-brand-500 shrink-0" />
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="flex items-center gap-4 pt-2">
                    <Link
                      to={`/property/${prop.id}`}
                      className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white font-bold text-sm shadow-lg hover:shadow-glow transition-all"
                    >
                      <span>View Available Suites</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      to={`/property/${prop.id}`}
                      className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                    >
                      Learn more →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Configurable Rental Types Highlights ── */}
      <section className="bg-slate-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-400">
              Flexible Tenancy Options
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight">
              Tailored Furnishing Configurations
            </h2>
            <p className="text-sm text-slate-300">
              Whether you need turnkey luxury furniture or prefer bringing your own custom decor, Panther PMS supports modular furnishing tiers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {rentalTypes.slice(0, 3).map((rt) => (
              <div
                key={rt.id}
                className="p-6 rounded-3xl bg-slate-800/80 border border-slate-700/80 flex flex-col justify-between space-y-6 hover:border-brand-500 transition-colors"
              >
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-bold">
                    <Layers className="w-3.5 h-3.5" />
                    {rt.name}
                  </div>
                  <h3 className="text-xl font-bold font-display">{rt.name}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{rt.description}</p>
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-700">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Included Inventory:</p>
                  <ul className="space-y-1.5 text-xs text-slate-200">
                    {rt.includedMaterials.slice(0, 4).map((item, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{item.name} ({item.quantity}x)</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Kigali Neighborhood Guide ── */}
      <section id="locations" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">Neighborhoods</span>
          <h2 className="text-3xl font-extrabold font-display text-slate-900 dark:text-white mt-1">Prime Kigali Locations</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6 rounded-2xl border shadow-soft space-y-2">
            <h4 className="font-bold text-lg text-slate-900 dark:text-white">Gacuriro Hillcrest</h4>
            <p className="text-xs text-slate-500">Hilltop estate views, tranquil family environments, and rapid access to MTN Center and major shopping malls.</p>
          </div>
          <div className="glass-card p-6 rounded-2xl border shadow-soft space-y-2">
            <h4 className="font-bold text-lg text-slate-900 dark:text-white">Nyarutarama Golf View</h4>
            <p className="text-xs text-slate-500">Upscale residential haven adjacent to the 18-hole Kigali Golf Club, tennis courts, and premier restaurants.</p>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA Banner ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-brand-700 via-brand-600 to-sky-600 p-8 sm:p-14 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-premium">
          <div className="space-y-3 text-center md:text-left max-w-xl">
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display">
              Ready to experience modern living in Kigali?
            </h2>
            <p className="text-sm text-brand-100">
              Explore available units, schedule a private tour, or request an instant online tenancy reservation.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 shrink-0">
            <Link
              to="/properties"
              className="px-6 py-3.5 rounded-xl bg-white text-brand-900 font-bold text-sm shadow-xl hover:bg-brand-50 transition-colors text-center"
            >
              Explore Available Units
            </Link>
            <Link
              to="/login"
              className="px-6 py-3.5 rounded-xl bg-brand-950/50 hover:bg-brand-950 text-white font-bold text-sm border border-white/20 transition-colors text-center"
            >
              Access Resident Portal
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
