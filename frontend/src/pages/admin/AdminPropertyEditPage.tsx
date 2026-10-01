import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import {
  Building,
  Save,
  ArrowLeft,
  Eye,
  Plus,
  Trash2,
  Image as ImageIcon,
  MapPin,
  Sparkles,
  Shield,
  Star,
  Check,
  CheckCircle2,
  DollarSign,
  Layers,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Property } from '../../types';

export const AdminPropertyEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { properties, addProperty, updateProperty } = useData();
  const { success, error } = useToast();

  const isNew = !id || id === 'new';
  const existingProperty = properties.find((p) => p.id === id);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [location, setLocation] = useState('Gacuriro, Gasabo');
  const [neighborhood, setNeighborhood] = useState('Gacuriro Hillcrest');
  const [city, setCity] = useState('Kigali');
  const [address, setAddress] = useState('KG 14 Ave, Kigali');
  const [totalRooms, setTotalRooms] = useState(24);
  const [yearBuilt, setYearBuilt] = useState(2024);
  const [rating, setRating] = useState(4.9);
  const [featured, setFeatured] = useState(true);
  const [monthlyRevenueEstimate, setMonthlyRevenueEstimate] = useState(28000);
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1200&auto=format&fit=crop&q=80',
  ]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [amenities, setAmenities] = useState<string[]>([
    'High-Speed Fiber Wi-Fi',
    '24/7 Gated Security & CCTV',
    'Backup Power Generator',
    'Covered Dedicated Parking',
    'Swimming Pool & Sun Deck',
    'Modern Fitness Gym',
    'Solar Water Heating',
    'Elevator Access',
  ]);
  const [newAmenity, setNewAmenity] = useState('');

  const standardAmenitiesList = [
    'High-Speed Fiber Wi-Fi',
    '24/7 Gated Security & CCTV',
    'Backup Power Generator',
    'Covered Dedicated Parking',
    'Swimming Pool & Sun Deck',
    'Modern Fitness Gym',
    'Solar Water Heating',
    'Elevator Access',
    'Golf Course Views',
    'Landscaped Gardens',
    'Private Balconies',
    'Water Reservoir System',
    'Concierge & Reception',
    'EV Vehicle Charging',
  ];

  // Populate existing property if editing
  useEffect(() => {
    if (!isNew && existingProperty) {
      setName(existingProperty.name);
      setCode(existingProperty.code);
      setLocation(existingProperty.location);
      setNeighborhood(existingProperty.neighborhood);
      setCity(existingProperty.city);
      setAddress(existingProperty.address);
      setTotalRooms(existingProperty.totalRooms);
      setYearBuilt(existingProperty.yearBuilt || 2024);
      setRating(existingProperty.rating);
      setFeatured(existingProperty.featured);
      setMonthlyRevenueEstimate(existingProperty.monthlyRevenueEstimate);
      setDescription(existingProperty.description);
      setImages(existingProperty.images.length > 0 ? existingProperty.images : ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80']);
      setAmenities(existingProperty.amenities || []);
    } else if (isNew) {
      setName('Gacuriro Executive Vista Residences');
      setCode('GVR');
      setDescription('Turnkey modern executive luxury apartments nestled in Gacuriro with breathtaking hillcrest views, 24/7 guarded security, infinity swimming pool, and high-speed fiber internet.');
    }
  }, [id, existingProperty, isNew]);

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

  const handleAddCustomAmenity = () => {
    if (!newAmenity.trim()) return;
    if (!amenities.includes(newAmenity.trim())) {
      setAmenities([...amenities, newAmenity.trim()]);
    }
    setNewAmenity('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      error('Validation Error', 'Property name is required.');
      return;
    }

    const payload: Property = {
      id: isNew ? `prop-${Date.now()}` : existingProperty!.id,
      name,
      code: code || name.slice(0, 3).toUpperCase(),
      location,
      neighborhood,
      city,
      address,
      totalRooms: Number(totalRooms),
      occupiedRooms: existingProperty ? existingProperty.occupiedRooms : Math.round(Number(totalRooms) * 0.8),
      availableRooms: existingProperty ? existingProperty.availableRooms : Math.round(Number(totalRooms) * 0.2),
      reservedRooms: existingProperty ? existingProperty.reservedRooms : 0,
      maintenanceRooms: existingProperty ? existingProperty.maintenanceRooms : 0,
      rating: Number(rating),
      reviewCount: existingProperty ? existingProperty.reviewCount : 12,
      featured: Boolean(featured),
      yearBuilt: Number(yearBuilt),
      monthlyRevenueEstimate: Number(monthlyRevenueEstimate),
      description,
      images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80'],
      amenities,
    };

    if (isNew) {
      addProperty(payload);
      success('Property Published', `Created "${name}" — now live on public catalog!`);
    } else {
      updateProperty(payload);
      success('Property Updated', `Saved configurations for "${name}" — public site updated.`);
    }

    navigate('/admin/properties');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <Link
            to="/admin/properties"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Properties Catalog</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 dark:text-white">
            {isNew ? 'Create New Residential Estate' : `Configure: ${name || 'Property'}`}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            This configuration feeds the public property discovery page and room reservation matrix.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {!isNew && existingProperty && (
            <Link
              to={`/property/${existingProperty.id}`}
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-sm transition-all"
            >
              <Eye className="w-4 h-4 text-brand-500" />
              <span>Preview Public Page</span>
            </Link>
          )}

          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md hover:shadow-glow transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save & Publish</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8 text-xs">
        {/* Section 1: Estate Identity & Location */}
        <div className="glass-card p-6 sm:p-7 rounded-3xl shadow-soft space-y-5 border">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
                1. Estate Identity & Geographical Location
              </h3>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
              />
              <span className="font-bold text-slate-700 dark:text-slate-300">
                ⭐ Feature on Public Homepage
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Property Brand Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Gacuriro Vista Suites"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Estate Code / Slug *
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. GVS"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold uppercase text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Location / District *
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              >
                <option value="Gacuriro, Gasabo">Gacuriro, Gasabo</option>
                <option value="Nyarutarama, Gasabo">Nyarutarama, Gasabo</option>
                <option value="Kimihurura, Gasabo">Kimihurura, Gasabo</option>
                <option value="Kiyovu, Nyarugenge">Kiyovu, Nyarugenge</option>
                <option value="Vision City, Gasabo">Vision City, Gasabo</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Neighborhood Area *
              </label>
              <input
                type="text"
                required
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                placeholder="e.g. Gacuriro Hillcrest Quarter"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                City / Region
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 font-bold mb-1">
              Physical Street & GPS Address *
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. KG 14 Ave, Plot 88, Gacuriro, Kigali"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Total Units Capacity *
              </label>
              <input
                type="number"
                required
                value={totalRooms}
                onChange={(e) => setTotalRooms(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Year Built / Commissioned
              </label>
              <input
                type="number"
                value={yearBuilt}
                onChange={(e) => setYearBuilt(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Est. Monthly Rent Roll ($)
              </label>
              <input
                type="number"
                value={monthlyRevenueEstimate}
                onChange={(e) => setMonthlyRevenueEstimate(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-emerald-600 dark:text-emerald-400 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Public Marketing Content & Description */}
        <div className="glass-card p-6 sm:p-7 rounded-3xl shadow-soft space-y-4 border">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
              2. Public Marketing Description & Highlights
            </h3>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 font-bold mb-1">
              Public Property Overview (Presented to potential tenants on website) *
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe architectural features, hillside views, security, privacy, and nearby lifestyle amenities..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium leading-relaxed text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Section 3: High-Res Photo Gallery Studio */}
        <div className="glass-card p-6 sm:p-7 rounded-3xl shadow-soft space-y-4 border">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
                3. High-Resolution Photo Gallery ({images.length} Photos)
              </h3>
            </div>
            <span className="text-slate-400 text-[11px]">Primary image is the main hero cover</span>
          </div>

          {/* Add Image URL Input */}
          <div className="flex gap-2">
            <input
              type="url"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="Enter high-res image URL (e.g. https://images.unsplash.com/...)"
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
          </div>

          {/* Gallery Tiles Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
            {images.map((img, i) => (
              <div key={i} className="relative rounded-2xl overflow-hidden group border border-slate-200 dark:border-slate-700 h-44 shadow-sm bg-slate-100 dark:bg-slate-800">
                <img src={img} alt={`Gallery ${i}`} className="w-full h-full object-cover" />
                
                {i === 0 && (
                  <span className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-brand-600 text-white font-black text-[10px] shadow-md">
                    COVER PHOTO
                  </span>
                )}

                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(i)}
                    className="p-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 shadow-md transition-colors"
                    title="Remove Photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Amenities & Lifestyle Facilities */}
        <div className="glass-card p-6 sm:p-7 rounded-3xl shadow-soft space-y-4 border">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
                4. Amenities & Property Facilities ({amenities.length} Selected)
              </h3>
            </div>
          </div>

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
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400'
                  }`}
                >
                  <span className="text-[11px] truncate">{item}</span>
                  {selected && <Check className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Custom Amenity Adder */}
          <div className="flex gap-2 pt-2">
            <input
              type="text"
              value={newAmenity}
              onChange={(e) => setNewAmenity(e.target.value)}
              placeholder="Add custom facility (e.g. Private Rooftop Lounge)"
              className="flex-1 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
            />
            <button
              type="button"
              onClick={handleAddCustomAmenity}
              className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-700 text-white font-bold text-xs"
            >
              Add Custom
            </button>
          </div>
        </div>

        {/* Bottom Save Action Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <Link
            to="/admin/properties"
            className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="px-8 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md hover:shadow-glow transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save & Publish Estate</span>
          </button>
        </div>
      </form>
    </div>
  );
};
