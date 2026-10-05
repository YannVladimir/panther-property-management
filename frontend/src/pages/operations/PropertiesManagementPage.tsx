import React, { useEffect, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { usePropertiesQuery } from '../../api/properties';
import { useRoomsQuery, useUpdateRoomStatusMutation } from '../../api/rooms';
import {
  Building,
  DoorOpen,
  MapPin,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Settings,
  Eye,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Room, RoomStatus } from '../../types';

export const PropertiesManagementPage: React.FC = () => {
  const { data: properties = [], isLoading: propertiesLoading } = usePropertiesQuery();
  const { data: rooms = [], isLoading: roomsLoading } = useRoomsQuery();
  const updateRoomStatus = useUpdateRoomStatusMutation();
  const { success, error } = useToast();

  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [newStatus, setNewStatus] = useState<RoomStatus>('available');

  useEffect(() => {
    if (!selectedPropertyId && properties.length > 0) {
      setSelectedPropertyId(properties[0].id);
    }
  }, [properties, selectedPropertyId]);

  const activeProperty = properties.find((p) => p.id === selectedPropertyId) || properties[0];
  const propertyRooms = activeProperty ? rooms.filter((r) => r.propertyId === activeProperty.id) : [];

  const filteredRooms = propertyRooms.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    return true;
  });

  const handleUpdateRoomStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;

    try {
      await updateRoomStatus.mutateAsync({ id: selectedRoom.id, status: newStatus });
      success('Room Updated', `Unit ${selectedRoom.roomNumber} status changed to ${newStatus.toUpperCase()}.`);
      setSelectedRoom(null);
    } catch {
      error('Update Failed', `Could not update unit ${selectedRoom.roomNumber}. Please try again.`);
    }
  };

  if (propertiesLoading || roomsLoading || !activeProperty) {
    return <div className="py-24 text-center text-sm text-slate-400">Loading properties…</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Portfolio Assets
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 dark:text-white mt-1">
            Properties & Room Matrix
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Monitor floor occupancy, manage unit availability, and configure room maintenance states.
          </p>
        </div>
      </div>

      {/* Property Selector Pills */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 text-xs">
        {properties.map((prop) => {
          const propRooms = rooms.filter((r) => r.propertyId === prop.id);
          const occupiedCount = propRooms.filter((r) => r.status === 'occupied').length;
          const isSelected = selectedPropertyId === prop.id;

          return (
            <button
              key={prop.id}
              onClick={() => setSelectedPropertyId(prop.id)}
              className={`p-3.5 rounded-2xl border text-left min-w-[200px] shrink-0 transition-all ${
                isSelected
                  ? 'bg-brand-600 text-white shadow-md border-brand-500 font-bold'
                  : 'glass-card text-slate-700 dark:text-slate-300 hover:border-brand-500/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm truncate">{prop.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                  {prop.code}
                </span>
              </div>
              <p className={`text-[11px] mt-1 ${isSelected ? 'text-brand-100' : 'text-slate-500'}`}>
                {occupiedCount}/{prop.totalRooms} Occupied ({Math.round((occupiedCount / prop.totalRooms) * 100)}%)
              </p>
            </button>
          );
        })}
      </div>

      {/* Active Property Overview Card */}
      <div className="glass-card p-6 sm:p-7 rounded-3xl shadow-soft flex flex-col md:flex-row items-center gap-6">
        <img
          src={activeProperty.images[0]}
          alt={activeProperty.name}
          className="w-full md:w-64 h-44 rounded-2xl object-cover shrink-0"
        />
        <div className="flex-1 space-y-3 w-full">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white">
              {activeProperty.name}
            </h2>
            <Badge variant="purple" size="sm">★ {activeProperty.rating} Rating</Badge>
          </div>
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-brand-500" />
            {activeProperty.address} ({activeProperty.neighborhood})
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
            {activeProperty.description}
          </p>

          <div className="flex flex-wrap gap-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold">Total Units</span>
              <p className="font-bold text-slate-900 dark:text-white">{activeProperty.totalRooms} Units</p>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold">Available Units</span>
              <p className="font-bold text-sky-600 dark:text-sky-400">
                {propertyRooms.filter((r) => r.status === 'available').length} Units
              </p>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold">Under Maintenance</span>
              <p className="font-bold text-rose-600 dark:text-rose-400">
                {propertyRooms.filter((r) => r.status === 'maintenance').length} Units
              </p>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold">Est. Monthly Rent Roll</span>
              <p className="font-bold text-emerald-600 dark:text-emerald-400">
                ${activeProperty.monthlyRevenueEstimate.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Visual Room Grid */}
      <div className="glass-card p-6 sm:p-7 rounded-3xl shadow-soft space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold font-display text-slate-900 dark:text-white">
              Visual Room Status Grid
            </h3>
            <p className="text-xs text-slate-500">
              Click any suite below to inspect specs or quickly update its live state.
            </p>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
            >
              <option value="all">All Room States</option>
              <option value="available">🟢 Available Only</option>
              <option value="occupied">🔴 Occupied Only</option>
              <option value="reserved">🟡 Reserved Only</option>
              <option value="maintenance">🔵 Maintenance Only</option>
            </select>
          </div>
        </div>

        {/* The Interactive Room Buttons Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {filteredRooms.map((r) => {
            const getRoomStyle = () => {
              switch (r.status) {
                case 'available':
                  return 'bg-emerald-50 text-emerald-950 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 shadow-sm';
                case 'reserved':
                  return 'bg-amber-50 text-amber-950 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-800 hover:bg-amber-100 shadow-sm';
                case 'maintenance':
                  return 'bg-sky-50 text-sky-950 border-sky-300 dark:bg-sky-950/60 dark:text-sky-200 dark:border-sky-800 hover:bg-sky-100 shadow-sm';
                case 'occupied':
                default:
                  return 'bg-rose-50 text-rose-950 border-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-900 hover:bg-rose-100';
              }
            };

            return (
              <button
                key={r.id}
                onClick={() => {
                  setSelectedRoom(r);
                  setNewStatus(r.status);
                }}
                className={`p-3 rounded-2xl border text-center transition-all duration-200 flex flex-col items-center justify-center space-y-1 hover:scale-105 ${getRoomStyle()}`}
              >
                <div className="flex items-center gap-1">
                  <span className="text-xs font-black">{r.roomNumber}</span>
                </div>
                <span className="text-[10px] font-semibold opacity-90">${r.monthlyRent}</span>
                <span className="text-[9px] uppercase font-bold tracking-wider opacity-80">
                  {r.status}
                </span>
                {r.currentClientName && (
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 truncate max-w-full font-medium">
                    {r.currentClientName.split(' ')[0]}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Room Quick Inspection & Status Edit Modal */}
      {selectedRoom && (
        <Modal
          isOpen={Boolean(selectedRoom)}
          onClose={() => setSelectedRoom(null)}
          title={`Unit ${selectedRoom.roomNumber} (${activeProperty.name})`}
          subtitle={`Floor ${selectedRoom.floor} • ${selectedRoom.bedrooms}BR / ${selectedRoom.bathrooms}BA • ${selectedRoom.sizeSqM} m²`}
        >
          <form onSubmit={handleUpdateRoomStatus} className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 space-y-1">
              <p><strong>Rental Type:</strong> {selectedRoom.furnishingType}</p>
              <p><strong>Monthly Rent:</strong> ${selectedRoom.monthlyRent} (Deposit: ${selectedRoom.deposit})</p>
              {selectedRoom.currentClientName && (
                <p><strong>Current Resident:</strong> {selectedRoom.currentClientName}</p>
              )}
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Change Operational Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as RoomStatus)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              >
                <option value="available">🟢 Available (Ready for leasing)</option>
                <option value="occupied">🔴 Occupied (Active lease)</option>
                <option value="reserved">🟡 Reserved (Pending move-in)</option>
                <option value="maintenance">🔵 Maintenance (Under repair)</option>
              </select>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={updateRoomStatus.isPending}
                className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md transition-all disabled:opacity-60"
              >
                {updateRoomStatus.isPending ? 'Saving…' : 'Save Room Status'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
