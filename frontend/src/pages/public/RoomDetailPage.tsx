import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useRoomQuery } from '../../api/rooms';
import { usePropertyQuery } from '../../api/properties';
import { useRentalTypesQuery } from '../../api/rentalTypes';
import { useCreateBookingMutation } from '../../api/bookings';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import confetti from 'canvas-confetti';
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
  Layers,
  Calendar,
  DollarSign,
  Maximize2,
  Bed,
  Bath,
  Maximize,
  Check,
  PackageCheck,
  FileText,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Drawer } from '../../components/common/Drawer';

export const RoomDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const createBookingMutation = useCreateBookingMutation();
  const { data: room, isLoading: roomLoading, isError: roomError } = useRoomQuery(id);
  const { data: property } = usePropertyQuery(room?.propertyId);
  const { data: rentalTypes = [] } = useRentalTypesQuery();
  const { success, error } = useToast();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const matchedRentalType = rentalTypes.find((rt) => rt.name === room?.furnishingType) ?? rentalTypes[0];

  const [bookingDrawerOpen, setBookingDrawerOpen] = useState(false);
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  // Booking Form State
  const [clientName, setClientName] = useState(currentUser ? currentUser.name : '');
  const [clientEmail, setClientEmail] = useState(currentUser ? currentUser.email : '');
  const [clientPhone, setClientPhone] = useState(currentUser?.phone || '+250 788 000 111');
  const [moveInDate, setMoveInDate] = useState('2026-09-01');
  const [notes, setNotes] = useState('');
  const [selectedRentalTypeId, setSelectedRentalTypeId] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (roomLoading || !room || !property || !matchedRentalType) {
    if (roomError) {
      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center space-y-4">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Room not found</h1>
          <p className="text-sm text-slate-500">This unit may have been removed or is no longer listed.</p>
          <Link to="/properties" className="inline-flex items-center gap-2 text-brand-600 dark:text-brand-400 font-bold hover:underline">
            <ArrowLeft className="w-4 h-4" />
            Back to all properties
          </Link>
        </div>
      );
    }
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center text-sm text-slate-400">
        Loading unit…
      </div>
    );
  }

  const selectedRentalTypeObj = rentalTypes.find((rt) => rt.id === selectedRentalTypeId) ?? matchedRentalType;
  const calculatedRent = Math.round(room.monthlyRent * (selectedRentalTypeObj.priceMultiplier / matchedRentalType.priceMultiplier));

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientEmail || !clientPhone) {
      error('Missing Information', 'Please fill in your name, email and phone number.');
      return;
    }

    setIsSubmitting(true);

    try {
      // currentUser?.clientId (not currentUser?.id — a User and a Client are different
      // entities). When absent (anonymous visitor, or a logged-in non-client role), omit
      // clientId entirely — the backend supports a booking with no linked client yet,
      // keeping just the name/email/phone snapshot fields (a pre-account inquiry).
      const newBooking = await createBookingMutation.mutateAsync({
        clientId: currentUser?.clientId,
        clientName,
        clientEmail,
        clientPhone,
        propertyId: property.id,
        roomId: room.id,
        rentalTypeId: selectedRentalTypeObj.id,
        moveInDate,
        monthlyRent: calculatedRent,
        deposit: calculatedRent,
        notes,
        source: 'client_portal',
      });

      setBookingDrawerOpen(false);

      // Trigger Confetti Celebration
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (err) {
        // Fallback
      }

      success(
        'Booking Request Submitted!',
        `Your reservation ${newBooking.bookingNumber} for Unit ${room.roomNumber} has been received by our operations desk.`
      );
    } catch {
      error('Submission Failed', 'Could not submit your booking request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
        <Link to="/properties" className="hover:text-brand-600">Properties</Link>
        <span>/</span>
        <Link to={`/property/${property.id}`} className="hover:text-brand-600">{property.name}</Link>
        <span>/</span>
        <span className="text-slate-900 dark:text-white">Unit {room.roomNumber}</span>
      </div>

      {/* Main Room Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge
              variant={
                room.status === 'available'
                  ? 'available'
                  : room.status === 'reserved'
                  ? 'reserved'
                  : room.status === 'maintenance'
                  ? 'maintenance'
                  : 'occupied'
              }
              size="md"
              dot
            >
              {room.status}
            </Badge>
            <Badge variant="purple" size="md">{room.furnishingType}</Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-slate-900 dark:text-white">
            Unit {room.roomNumber} — {property.name}
          </h1>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-brand-500 shrink-0" />
            <span>Floor {room.floor} • {property.location}</span>
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-xs text-slate-400">Monthly Rent</span>
            <p className="text-3xl font-extrabold font-display text-brand-600 dark:text-brand-400">
              ${room.monthlyRent}
              <span className="text-xs text-slate-500 font-normal">/mo</span>
            </p>
          </div>
          <button
            onClick={() => setBookingDrawerOpen(true)}
            className="px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-glow transition-all"
          >
            Book This Unit
          </button>
        </div>
      </div>

      {/* Photo Gallery Showcase */}
      <div className="space-y-4">
        <div className="h-[420px] rounded-3xl overflow-hidden shadow-soft relative">
          <img
            src={room.images[activeImgIndex] || room.images[0]}
            alt={room.roomNumber}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {room.images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveImgIndex(idx)}
              className={`w-24 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                activeImgIndex === idx ? 'border-brand-500 shadow-md' : 'border-transparent opacity-70'
              }`}
            >
              <img src={img} alt="Thumb" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* Core Specs Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-2xl border shadow-soft flex items-center gap-3">
          <div className="p-3 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600">
            <Bed className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Bedrooms</p>
            <p className="text-base font-bold text-slate-900 dark:text-white">{room.bedrooms} Bedroom</p>
          </div>
        </div>
        <div className="glass-card p-4 rounded-2xl border shadow-soft flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
            <Bath className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Bathrooms</p>
            <p className="text-base font-bold text-slate-900 dark:text-white">{room.bathrooms} Baths</p>
          </div>
        </div>
        <div className="glass-card p-4 rounded-2xl border shadow-soft flex items-center gap-3">
          <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600">
            <Maximize className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Total Size</p>
            <p className="text-base font-bold text-slate-900 dark:text-white">{room.sizeSqM} m²</p>
          </div>
        </div>
        <div className="glass-card p-4 rounded-2xl border shadow-soft flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Floor Level</p>
            <p className="text-base font-bold text-slate-900 dark:text-white">Floor {room.floor}</p>
          </div>
        </div>
      </div>

      {/* Main Details & Furnishing Options */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left 2 cols */}
        <div className="lg:col-span-2 space-y-10">
          {/* Description */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl shadow-soft space-y-4">
            <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white">
              Suite Overview & Details
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {room.description}
            </p>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                Unit Amenities & Smart Features
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {room.amenities.map((amenity, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Furnishing Type & Materials Assigned */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl shadow-soft space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white">
                  Included Furnishing Inventory
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pre-configured furniture provided under the {matchedRentalType.name} contract
                </p>
              </div>
              <Badge variant="purple" size="sm">
                <PackageCheck className="w-3.5 h-3.5" />
                {matchedRentalType.includedMaterials.length} Items Included
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold text-[10px]">
                    <th className="pb-3">Item Description</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Quantity</th>
                    <th className="pb-3">Condition Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {matchedRentalType.includedMaterials.map((item) => (
                    <tr key={item.id} className="py-2.5">
                      <td className="py-3 font-semibold text-slate-900 dark:text-white">{item.name}</td>
                      <td className="py-3 text-slate-500">{item.category}</td>
                      <td className="py-3">{item.quantity}x</td>
                      <td className="py-3">
                        <Badge variant="success" size="sm">{item.condition}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tenancy Rules */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl shadow-soft space-y-4">
            <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white">
              Building & House Rules
            </h2>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              {room.rules.map((rule, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Sidebar: Rent Breakdown & Request Booking Card */}
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-3xl shadow-soft space-y-6 sticky top-28">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                Transparent Pricing
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold font-display text-slate-900 dark:text-white">
                  ${room.monthlyRent}
                </span>
                <span className="text-xs text-slate-500">/ month</span>
              </div>
            </div>

            {/* Breakdown List */}
            <div className="space-y-2.5 text-xs pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Monthly Rent</span>
                <span className="font-bold text-slate-900 dark:text-white">${room.monthlyRent}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Refundable Security Deposit</span>
                <span className="font-bold text-slate-900 dark:text-white">${room.deposit}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Dedicated Fiber Internet</span>
                <span className="font-bold text-emerald-600">Included</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>24/7 Guarded Security</span>
                <span className="font-bold text-emerald-600">Included</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Water & Submetering</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">Billed monthly by usage</span>
              </div>
            </div>

            <button
              onClick={() => setBookingDrawerOpen(true)}
              className="w-full py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-glow transition-all flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              <span>Request Tenancy Booking</span>
            </button>

            <div className="pt-2 text-[11px] text-slate-400 text-center leading-relaxed">
              No reservation fee required upfront. Background check and key handover managed by Panther operations.
            </div>
          </div>
        </div>
      </div>

      {/* Booking Drawer Form */}
      <Drawer
        isOpen={bookingDrawerOpen}
        onClose={() => setBookingDrawerOpen(false)}
        title={`Book Unit ${room.roomNumber}`}
        subtitle={`${property.name} — ${property.location}`}
        width="lg"
      >
        <form onSubmit={handleBookingSubmit} className="space-y-6">
          <div className="p-4 rounded-2xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 space-y-1">
            <p className="text-xs font-bold text-brand-900 dark:text-brand-300">
              Unit {room.roomNumber} ({room.bedrooms}BR • {room.sizeSqM} m²)
            </p>
            <p className="text-xs text-brand-700 dark:text-brand-400">
              Selected Furnishing: <strong>{selectedRentalTypeObj.name}</strong> (${calculatedRent}/mo)
            </p>
          </div>

          {/* Furnishing Tier Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Select Desired Furnishing Package
            </label>
            <div className="space-y-2">
              {rentalTypes.map((rt) => (
                <label
                  key={rt.id}
                  className={`flex items-start justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    (selectedRentalTypeId ?? matchedRentalType.id) === rt.id
                      ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="radio"
                      name="rentalTypeOption"
                      checked={(selectedRentalTypeId ?? matchedRentalType.id) === rt.id}
                      onChange={() => setSelectedRentalTypeId(rt.id)}
                      className="mt-1 text-brand-600 focus:ring-brand-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{rt.name}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{rt.description}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-brand-600 dark:text-brand-400 shrink-0">
                    ${Math.round(room.monthlyRent * (rt.priceMultiplier / matchedRentalType.priceMultiplier))}/mo
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Tenant Contact Information */}
          <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Prospective Tenant Details
            </span>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Full Legal Name *
              </label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Jean-Paul Ndahiro"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="name@organization.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">
                  Phone Number (WhatsApp) *
                </label>
                <input
                  type="text"
                  required
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="+250 788 123 456"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Target Move-in Date *
              </label>
              <input
                type="date"
                required
                value={moveInDate}
                onChange={(e) => setMoveInDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Special Requests or Notes (Optional)
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Requesting parking permit, corporate lease agreement requirements..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white text-xs placeholder:text-slate-400 resize-none focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all"
            >
              {isSubmitting ? 'Submitting Reservation...' : 'Submit Booking Request'}
            </button>
          </div>
        </form>
      </Drawer>
    </div>
  );
};
