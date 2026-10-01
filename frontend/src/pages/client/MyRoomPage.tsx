import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  DoorOpen,
  Bed,
  Bath,
  Maximize,
  Building,
  CheckCircle2,
  Wifi,
  Shield,
  Layers,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export const MyRoomPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { clients, rooms, properties } = useData();

  const client = clients.find((c) => c.id === currentUser?.clientId) || clients[0];
  const room = rooms.find((r) => r.id === client.currentRoomId) || rooms[0];
  const property = properties.find((p) => p.id === client.currentPropertyId) || properties[0];

  const [activeImg, setActiveImg] = useState(0);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="occupied" size="sm">Active Resident</Badge>
          <Badge variant="purple" size="sm">{client.rentalType}</Badge>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 dark:text-white">
          My Apartment — Unit {room.roomNumber}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-brand-500 shrink-0" />
          <span>{property.name} • Floor {room.floor} • {property.location}</span>
        </p>
      </div>

      {/* Gallery */}
      <div className="space-y-3">
        <div className="h-80 sm:h-96 rounded-3xl overflow-hidden shadow-soft">
          <img src={room.images[activeImg] || room.images[0]} alt="My Room" className="w-full h-full object-cover" />
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {room.images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveImg(i)}
              className={`w-20 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                activeImg === i ? 'border-brand-500' : 'border-transparent opacity-70'
              }`}
            >
              <img src={img} alt="Thumb" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* Specs Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-2xl border shadow-soft flex items-center gap-3">
          <div className="p-3 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600">
            <Bed className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase">Bedrooms</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{room.bedrooms} Bedrooms</p>
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border shadow-soft flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
            <Bath className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase">Bathrooms</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{room.bathrooms} Baths</p>
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border shadow-soft flex items-center gap-3">
          <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600">
            <Maximize className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase">Floor Area</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{room.sizeSqM} m²</p>
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border shadow-soft flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase">Floor</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">Floor {room.floor}</p>
          </div>
        </div>
      </div>

      {/* Utilities Included & House Rules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-card p-6 rounded-3xl shadow-soft space-y-4">
          <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
            Included Utilities & Services
          </h3>
          <div className="space-y-2">
            {room.utilitiesIncluded.map((util, i) => (
              <div key={i} className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>{util}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6 rounded-3xl shadow-soft space-y-4">
          <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
            Building Rules & Regulations
          </h3>
          <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
            {room.rules.map((rule, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
