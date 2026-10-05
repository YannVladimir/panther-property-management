import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePropertyQuery } from '../../api/properties';
import { useRoomsQuery } from '../../api/rooms';
import {
  MapPin,
  Building,
  CheckCircle2,
  Phone,
  Mail,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Wifi,
  Shield,
  Car,
  Layers,
  DoorOpen,
  Calendar,
  DollarSign,
  Maximize2,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

export const PropertyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: property, isLoading, isError } = usePropertyQuery(id);
  const { data: propertyRooms = [] } = useRoomsQuery({ propertyId: id });
  const availableRooms = propertyRooms.filter((r) => r.status === 'available');

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center text-sm text-slate-400">
        Loading property…
      </div>
    );
  }

  if (isError || !property) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center space-y-4">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Property not found</h1>
        <p className="text-sm text-slate-500">This listing may have been removed or is no longer available.</p>
        <Link to="/properties" className="inline-flex items-center gap-2 text-brand-600 dark:text-brand-400 font-bold hover:underline">
          <ArrowLeft className="w-4 h-4" />
          Back to all properties
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Back link */}
      <div>
        <Link
          to="/properties"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-brand-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to all properties</span>
        </Link>
      </div>

      {/* Property Title & Header Meta */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="purple" size="sm">★ {property.rating} ({property.reviewCount} reviews)</Badge>
            <Badge variant="available" size="sm">{availableRooms.length} Units Available</Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-slate-900 dark:text-white">
            {property.name}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-brand-500 shrink-0" />
            <span>{property.address} — {property.location}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-slate-400">Monthly Rent from</span>
            <p className="text-3xl font-extrabold font-display text-brand-600 dark:text-brand-400">
              ${Math.min(...propertyRooms.map((r) => r.monthlyRent))}
              <span className="text-xs text-slate-500 font-normal">/mo</span>
            </p>
          </div>
        </div>
      </div>

      {/* Luxury Photo Gallery Grid */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 h-[450px]">
          {/* Main Large Photo */}
          <div
            className="md:col-span-2 h-full rounded-2xl overflow-hidden relative group cursor-pointer"
            onClick={() => setGalleryModalOpen(true)}
          >
            <img
              src={property.images[activeImageIndex] || property.images[0]}
              alt={property.name}
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
            />
            <button className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur-md text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-2 border border-white/20">
              <Maximize2 className="w-3.5 h-3.5" />
              <span>View Fullscreen Gallery ({property.images.length})</span>
            </button>
          </div>

          {/* Right Thumbnails */}
          <div className="hidden md:grid grid-rows-2 gap-3 h-full">
            {property.images.slice(1, 3).map((img, index) => (
              <div
                key={index}
                onClick={() => setActiveImageIndex(index + 1)}
                className={`rounded-2xl overflow-hidden cursor-pointer relative border-2 transition-all ${
                  activeImageIndex === index + 1 ? 'border-brand-500' : 'border-transparent hover:opacity-90'
                }`}
              >
                <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        {/* Thumbnail bar */}
        <div className="flex gap-3 overflow-x-auto pb-2">
          {property.images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveImageIndex(i)}
              className={`w-20 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                activeImageIndex === i ? 'border-brand-500 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* Main Details + Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column (2 Cols): Overview, Amenities, Room Matrix, Available Rooms */}
        <div className="lg:col-span-2 space-y-10">
          {/* Description */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl shadow-soft space-y-4">
            <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white">
              About {property.name}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {property.description}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[11px] uppercase font-bold text-slate-400">Total Units</span>
                <p className="text-base font-bold text-slate-900 dark:text-white">{property.totalRooms} Suites</p>
              </div>
              <div>
                <span className="text-[11px] uppercase font-bold text-slate-400">Occupancy</span>
                <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                  {Math.round((property.occupiedRooms / property.totalRooms) * 100)}%
                </p>
              </div>
              <div>
                <span className="text-[11px] uppercase font-bold text-slate-400">Year Built</span>
                <p className="text-base font-bold text-slate-900 dark:text-white">{property.yearBuilt}</p>
              </div>
              <div>
                <span className="text-[11px] uppercase font-bold text-slate-400">Security</span>
                <p className="text-base font-bold text-slate-900 dark:text-white">24/7 Guarded</p>
              </div>
            </div>
          </div>

          {/* Building Amenities */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl shadow-soft space-y-6">
            <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white">
              Included Building Amenities
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {property.amenities.map((amenity, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{amenity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Visual Room Grid / Availability Matrix */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl shadow-soft space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white">
                  Room Availability Matrix
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Visual floor distribution for {property.name}
                </p>
              </div>
              {/* Status Legend */}
              <div className="hidden sm:flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Available</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Occupied</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Reserved</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> Maintenance</span>
              </div>
            </div>

            {/* Room Matrix Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {propertyRooms.map((room) => {
                const getStatusColor = () => {
                  switch (room.status) {
                    case 'available':
                      return 'bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-200 dark:border-emerald-800 hover:bg-emerald-100';
                    case 'reserved':
                      return 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/70 dark:text-amber-200 dark:border-amber-800';
                    case 'maintenance':
                      return 'bg-sky-50 text-sky-900 border-sky-300 dark:bg-sky-950/70 dark:text-sky-200 dark:border-sky-800';
                    case 'occupied':
                    default:
                      return 'bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900';
                  }
                };

                return (
                  <Link
                    key={room.id}
                    to={`/room/${room.id}`}
                    className={`p-3 rounded-2xl border text-center transition-all duration-200 flex flex-col items-center justify-center space-y-1 shadow-sm hover:scale-105 ${getStatusColor()}`}
                  >
                    <span className="text-xs font-extrabold">{room.roomNumber}</span>
                    <span className="text-[10px] opacity-80">{room.bedrooms}BR • ${room.monthlyRent}</span>
                    <span className="text-[9px] uppercase font-bold tracking-wider">{room.status}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Available Units Direct List */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white">
              Available Units ({availableRooms.length})
            </h2>

            <div className="space-y-4">
              {availableRooms.map((room) => (
                <div
                  key={room.id}
                  className="glass-card p-5 rounded-2xl shadow-soft hover:shadow-premium transition-all flex flex-col sm:flex-row gap-5 items-center justify-between"
                >
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <img
                      src={room.images[0] || property.images[0]}
                      alt={room.roomNumber}
                      className="w-20 h-20 rounded-xl object-cover shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="available" size="sm">Available Now</Badge>
                        <span className="text-xs font-semibold text-slate-500">{room.furnishingType}</span>
                      </div>
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                        Unit {room.roomNumber} — {room.bedrooms} Bed / {room.bathrooms} Bath
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Floor {room.floor} • {room.sizeSqM} m² • High-speed Wi-Fi included
                      </p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 gap-3">
                    <div className="text-left sm:text-right">
                      <span className="text-[11px] text-slate-400">Monthly</span>
                      <p className="text-xl font-extrabold text-brand-600 dark:text-brand-400">
                        ${room.monthlyRent}
                      </p>
                    </div>
                    <Link
                      to={`/room/${room.id}`}
                      className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md transition-colors flex items-center gap-1.5"
                    >
                      <span>View & Book</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Contact & Concierge Card */}
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-3xl shadow-soft space-y-5 sticky top-28">
            <h3 className="text-lg font-bold font-display text-slate-900 dark:text-white">
              Panther Concierge Office
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Schedule a private walkthrough or inquire about corporate leases for {property.name}.
            </p>

            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                <Phone className="w-4 h-4 text-brand-500" />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">+250 788 123 456</p>
                  <p className="text-[10px] text-slate-400">Mon - Sat (8:00 AM - 7:00 PM)</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                <Mail className="w-4 h-4 text-brand-500" />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">concierge@panther.rw</p>
                  <p className="text-[10px] text-slate-400">Direct operations desk</p>
                </div>
              </div>
            </div>

            {/* Neighborhood map placeholder card */}
            <div className="rounded-2xl bg-slate-100 dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                <MapPin className="w-4 h-4 text-brand-500" />
                <span>Kigali Location Map</span>
              </div>
              <div className="h-32 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 text-xs text-center p-2">
                Interactive Kigali GPS Coordinates: Gasabo / Kimihurura Diplomatic Belt
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Gallery Modal */}
      <Modal isOpen={galleryModalOpen} onClose={() => setGalleryModalOpen(false)} maxWidth="4xl" title={`${property.name} Gallery`}>
        <div className="space-y-4">
          <div className="h-96 rounded-2xl overflow-hidden">
            <img src={property.images[activeImageIndex]} alt="Gallery Large" className="w-full h-full object-cover" />
          </div>
          <div className="grid grid-cols-4 gap-3">
            {property.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImageIndex(i)}
                className={`h-24 rounded-xl overflow-hidden border-2 ${
                  activeImageIndex === i ? 'border-brand-500' : 'border-transparent opacity-70'
                }`}
              >
                <img src={img} alt="thumb" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};
