import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { usePropertiesQuery } from '../../api/properties';
import { useBuildingsQuery } from '../../api/buildings';
import { useRoomQuery, useCreateRoomMutation, useUpdateRoomMutation, RoomInput } from '../../api/rooms';
import { useToast } from '../../context/ToastContext';
import {
  DoorOpen,
  Save,
  ArrowLeft,
  Eye,
  Plus,
  Trash2,
  Image as ImageIcon,
  DollarSign,
  Sparkles,
  Check,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { FileUploadButton } from '../../components/common/FileUploadButton';
import { RoomStatus, FurnishingType } from '../../types';

export const AdminRoomEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const isNew = !id || id === 'new';
  const { data: existingRoom, isLoading: isLoadingRoom } = useRoomQuery(isNew ? undefined : id);
  const { data: properties = [] } = usePropertiesQuery();
  const createRoom = useCreateRoomMutation();
  const updateRoom = useUpdateRoomMutation();
  const saving = createRoom.isPending || updateRoom.isPending;

  // Form State
  const [propertyId, setPropertyId] = useState('');
  const { data: buildings = [] } = useBuildingsQuery(propertyId || undefined);
  const [buildingId, setBuildingId] = useState('');
  const [roomNumber, setRoomNumber] = useState('V-101');
  const [floor, setFloor] = useState(1);
  const [sizeSqM, setSizeSqM] = useState(75);
  const [bedrooms, setBedrooms] = useState(2);
  const [bathrooms, setBathrooms] = useState(2);
  const [furnishingType, setFurnishingType] = useState<FurnishingType>('Fully Furnished');
  const [monthlyRent, setMonthlyRent] = useState(920);
  const [deposit, setDeposit] = useState(920);
  const [status, setStatus] = useState<RoomStatus>('available');
  const [virtualTourUrl, setVirtualTourUrl] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1000&auto=format&fit=crop&q=80',
  ]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [amenities, setAmenities] = useState<string[]>([
    'High-Speed Wi-Fi',
    'Smart Lock Access',
    'Private Scenic Balcony',
    'AC in Master Bedroom',
    'Ensuite Master Bathroom',
    'Fully Equipped Modern Kitchen',
  ]);
  const [utilitiesIncluded, setUtilitiesIncluded] = useState<string[]>([
    'High-Speed Fiber Internet',
    '24/7 Gated Security',
    'Compound Maintenance',
    'Garbage Collection',
  ]);
  const [rules, setRules] = useState<string[]>([
    'No smoking inside suite',
    'Quiet hours from 10:00 PM to 7:00 AM',
    'Small pets permitted upon registration',
  ]);

  const standardAmenitiesList = [
    'High-Speed Wi-Fi',
    'Smart Lock Access',
    'Private Scenic Balcony',
    'AC in Master Bedroom',
    'Ensuite Master Bathroom',
    'Fully Equipped Modern Kitchen',
    'Dishwasher & Microwave',
    'Dedicated Workstation Desk',
    'In-unit Washing Machine',
    'Walk-in Wardrobe',
    'OLED 4K Smart TV',
    'Wine Cooler / Mini-bar',
  ];

  const standardUtilitiesList = [
    'High-Speed Fiber Internet',
    '24/7 Gated Security',
    'Compound Maintenance',
    'Garbage Collection',
    'Water Booster Supply',
    'Backup Generator Power',
    'Gym & Pool Access',
  ];

  // Default the property picker to the first real property once loaded, for a brand new room.
  useEffect(() => {
    if (isNew && !propertyId && properties.length > 0) {
      setPropertyId(properties[0].id);
    }
  }, [isNew, propertyId, properties]);

  useEffect(() => {
    if (!isNew && existingRoom) {
      setPropertyId(existingRoom.propertyId);
      setBuildingId(existingRoom.buildingId || '');
      setRoomNumber(existingRoom.roomNumber);
      setFloor(existingRoom.floor);
      setSizeSqM(existingRoom.sizeSqM);
      setBedrooms(existingRoom.bedrooms);
      setBathrooms(existingRoom.bathrooms);
      setFurnishingType(existingRoom.furnishingType);
      setMonthlyRent(existingRoom.monthlyRent);
      setDeposit(existingRoom.deposit);
      setStatus(existingRoom.status);
      setVirtualTourUrl(existingRoom.virtualTourUrl || '');
      setDescription(existingRoom.description);
      setImages(existingRoom.images.length > 0 ? existingRoom.images : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1000&auto=format&fit=crop&q=80']);
      setAmenities(existingRoom.amenities || []);
      setUtilitiesIncluded(existingRoom.utilitiesIncluded || []);
      setRules(existingRoom.rules || []);
    } else if (isNew) {
      setDescription('Sophisticated luxury apartment suite with expansive floor-to-ceiling windows, private sunset balcony, custom Italian kitchen cabinetry, and ultra-fast optical fiber connectivity.');
    }
  }, [id, existingRoom, isNew]);

  // A building only belongs to one property — clear the selection if it no longer matches
  // the buildings actually available for the currently-selected property.
  useEffect(() => {
    if (buildingId && !buildings.some((b) => b.id === buildingId)) {
      setBuildingId('');
    }
  }, [buildings, buildingId]);

  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    setImages([...images, newImageUrl.trim()]);
    setNewImageUrl('');
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleToggleAmenity = (item: string) => {
    if (amenities.includes(item)) {
      setAmenities(amenities.filter((a) => a !== item));
    } else {
      setAmenities([...amenities, item]);
    }
  };

  const handleToggleUtility = (item: string) => {
    if (utilitiesIncluded.includes(item)) {
      setUtilitiesIncluded(utilitiesIncluded.filter((u) => u !== item));
    } else {
      setUtilitiesIncluded([...utilitiesIncluded, item]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomNumber.trim()) {
      error('Validation Error', 'Room / Unit number is required.');
      return;
    }
    if (!propertyId) {
      error('Validation Error', 'Select a parent property first.');
      return;
    }

    const selectedProp = properties.find((p) => p.id === propertyId) || properties[0];

    const payload: RoomInput = {
      propertyId: selectedProp.id,
      buildingId: buildingId || '',
      roomNumber,
      floor: Number(floor),
      sizeSqM: Number(sizeSqM),
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      furnishingType,
      monthlyRent: Number(monthlyRent),
      deposit: Number(deposit),
      status,
      description,
      virtualTourUrl,
      images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1000&auto=format&fit=crop&q=80'],
      amenities,
      utilitiesIncluded,
      rules,
    };

    try {
      if (isNew) {
        await createRoom.mutateAsync(payload);
        success('Suite Created', `Unit ${roomNumber} added to ${selectedProp.name} inventory.`);
      } else {
        await updateRoom.mutateAsync({ id: existingRoom!.id, input: payload });
        success('Suite Updated', `Saved configurations for Unit ${roomNumber} — live on public matrix.`);
      }
      navigate('/admin/buildings-rooms');
    } catch {
      error('Save Failed', 'Could not save this room. Please try again.');
    }
  };

  if (!isNew && isLoadingRoom) {
    return <div className="max-w-5xl mx-auto py-24 text-center text-sm text-slate-400">Loading room…</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <Link
            to="/admin/buildings-rooms"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Rooms Inventory</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 dark:text-white">
            {isNew ? 'Add New Suite / Apartment' : `Configure Unit ${roomNumber}`}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            This configuration feeds the public room detail page, pricing breakdown, and booking drawer.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {!isNew && existingRoom && (
            <Link
              to={`/room/${existingRoom.id}`}
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-sm transition-all"
            >
              <Eye className="w-4 h-4 text-brand-500" />
              <span>Preview Public Room</span>
            </Link>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md hover:shadow-glow transition-all disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving…' : 'Save & Publish Unit'}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8 text-xs">
        {/* Section 1: Property Assignment & Unit Identity */}
        <div className="glass-card p-6 sm:p-7 rounded-3xl shadow-soft space-y-5 border">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <DoorOpen className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
                1. Unit Identity & Property Association
              </h3>
            </div>
            <Badge
              variant={status === 'available' ? 'success' : status === 'occupied' ? 'danger' : 'warning'}
              size="sm"
              dot
            >
              {status.toUpperCase()}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Parent Estate Property *
              </label>
              <select
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.location.split(',')[0]})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Unit / Suite Number *
              </label>
              <input
                type="text"
                required
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder="e.g. V-101 or G-302"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Building Wing / Block
              </label>
              <select
                value={buildingId}
                onChange={(e) => setBuildingId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              >
                <option value="">No specific building</option>
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Floor Level
              </label>
              <input
                type="number"
                required
                value={floor}
                onChange={(e) => setFloor(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Floor Area (m²) *
              </label>
              <input
                type="number"
                required
                value={sizeSqM}
                onChange={(e) => setSizeSqM(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Bedrooms *
              </label>
              <input
                type="number"
                required
                value={bedrooms}
                onChange={(e) => setBedrooms(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Bathrooms *
              </label>
              <input
                type="number"
                required
                value={bathrooms}
                onChange={(e) => setBathrooms(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Furnishing Tier & Pricing Rules */}
        <div className="glass-card p-6 sm:p-7 rounded-3xl shadow-soft space-y-5 border">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <DollarSign className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
              2. Furnishing Package, Rental Pricing & Live Status
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Furnishing Package *
              </label>
              <select
                value={furnishingType}
                onChange={(e) => setFurnishingType(e.target.value as FurnishingType)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              >
                <option value="Fully Furnished">Fully Furnished</option>
                <option value="Self Furnished">Self Furnished</option>
                <option value="Executive Luxury">Executive Luxury</option>
                <option value="Semi-Furnished">Semi-Furnished</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Monthly Rent ($ USD) *
              </label>
              <input
                type="number"
                required
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-extrabold text-brand-600 dark:text-brand-400 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Security Deposit ($ USD) *
              </label>
              <input
                type="number"
                required
                value={deposit}
                onChange={(e) => setDeposit(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Operational Status *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as RoomStatus)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              >
                <option value="available">🟢 Available (Live on Public Booking)</option>
                <option value="occupied">🔴 Occupied (Active Tenant)</option>
                <option value="reserved">🟡 Reserved (Pending Move-in)</option>
                <option value="maintenance">🔵 Maintenance (Under Repair)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Public Listing Overview & Virtual Tour */}
        <div className="glass-card p-6 sm:p-7 rounded-3xl shadow-soft space-y-4 border">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
              3. Suite Overview & Virtual 3D Tour Link
            </h3>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 font-bold mb-1">
              Public Description (Displayed on Room Detail Page) *
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail the layout, view orientation, bathroom fixtures, and interior lighting..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium leading-relaxed text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 font-bold mb-1">
              3D Matterport / Virtual Tour URL (Optional)
            </label>
            <input
              type="url"
              value={virtualTourUrl}
              onChange={(e) => setVirtualTourUrl(e.target.value)}
              placeholder="https://my.matterport.com/show/?m=..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Section 4: Unit High-Res Photo Gallery */}
        <div className="glass-card p-6 sm:p-7 rounded-3xl shadow-soft space-y-4 border">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
                4. Unit Photo Gallery ({images.length} Photos)
              </h3>
            </div>
            <span className="text-slate-400 text-[11px]">Primary image is used for thumbnail cards</span>
          </div>

          <div className="flex gap-2">
            <input
              type="url"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="Add room image URL (Living room, bedroom, kitchen, ensuite bathroom...)"
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
            <button
              type="button"
              onClick={handleAddImage}
              className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Photo</span>
            </button>
            <FileUploadButton
              folder="room-photos"
              accept="image/*"
              multiple
              label="Upload Photo"
              onUploaded={(result) => setImages((prev) => [...prev, result.url])}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {images.map((img, i) => (
              <div key={i} className="relative rounded-2xl overflow-hidden group border border-slate-200 dark:border-slate-700 h-40 shadow-sm bg-slate-100 dark:bg-slate-800">
                <img src={img} alt={`Room Photo ${i}`} className="w-full h-full object-cover" />
                {i === 0 && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-brand-600 text-white font-black text-[9px]">
                    MAIN
                  </span>
                )}
                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(i)}
                    className="p-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 shadow-md"
                    title="Remove Photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 5: Suite Amenities & Utilities */}
        <div className="glass-card p-6 sm:p-7 rounded-3xl shadow-soft space-y-6 border">
          <div>
            <h3 className="text-base font-bold font-display text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
              5. Suite Amenities & Included Utilities
            </h3>
          </div>

          <div className="space-y-3">
            <span className="text-[11px] uppercase font-bold text-slate-400">Suite Amenities</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {standardAmenitiesList.map((item) => {
                const selected = amenities.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleToggleAmenity(item)}
                    className={`p-2.5 rounded-xl border text-left font-bold transition-all flex items-center justify-between gap-2 ${
                      selected
                        ? 'bg-brand-50 dark:bg-brand-950/60 border-brand-500 text-brand-700 dark:text-brand-300 shadow-2xs'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span className="text-[11px] truncate">{item}</span>
                    {selected && <Check className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <span className="text-[11px] uppercase font-bold text-slate-400">Utilities Included in Rent</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {standardUtilitiesList.map((item) => {
                const selected = utilitiesIncluded.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleToggleUtility(item)}
                    className={`p-2.5 rounded-xl border text-left font-bold transition-all flex items-center justify-between gap-2 ${
                      selected
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-2xs'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span className="text-[11px] truncate">{item}</span>
                    {selected && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Bottom Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <Link
            to="/admin/buildings-rooms"
            className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md hover:shadow-glow transition-all flex items-center gap-2 disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving…' : 'Save & Publish Unit'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
