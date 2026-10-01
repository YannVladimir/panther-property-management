import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import {
  CalendarCheck2,
  Search,
  CheckCircle2,
  XCircle,
  DoorOpen,
  User,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building,
  Plus,
  Eye,
  Globe,
  UserCheck,
  UserX,
  Phone,
  Mail,
  FileText,
  Calendar,
  DollarSign,
  AlertTriangle,
  X,
  Send,
  Layers,
  Sparkles,
  Printer,
  ChevronRight,
  Check,
  Key,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Pagination } from '../../components/common/Pagination';
import { Modal } from '../../components/common/Modal';
import { Booking, BookingStatus, FurnishingType, Room } from '../../types';

export const BookingsManagementPage: React.FC = () => {
  const {
    bookings,
    rooms,
    properties,
    rentalTypes,
    clients,
    addBooking,
    updateBookingStatus,
    assignRoomToBooking,
    updateClientStatus,
  } = useData();
  const { success, info, error } = useToast();

  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'client' | 'manager'>('all');
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Detail Drawer State
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Add Booking Drawer State
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);

  // Assign Room Modal State
  const [assignRoomModalOpen, setAssignRoomModalOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState('');

  // Approve Confirmation Modal State
  const [confirmApproveBooking, setConfirmApproveBooking] = useState<Booking | null>(null);

  // New Booking Form State
  const [newClientMode, setNewClientMode] = useState<'existing' | 'new'>('new');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientNationality, setNewClientNationality] = useState('Rwandan');
  const [newPropertyId, setNewPropertyId] = useState(properties[0]?.id || 'prop-01');
  const [newRentalTypeId, setNewRentalTypeId] = useState(rentalTypes[0]?.id || 'rt-01');
  const [newRoomId, setNewRoomId] = useState<string>('');
  const [newMoveInDate, setNewMoveInDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [newMoveOutDate, setNewMoveOutDate] = useState(
    new Date(Date.now() + 372 * 86400000).toISOString().split('T')[0]
  );
  const [newMonthlyRent, setNewMonthlyRent] = useState<number>(850);
  const [newDeposit, setNewDeposit] = useState<number>(850);
  const [newSource, setNewSource] = useState<'operations_manager' | 'walk_in' | 'phone_inquiry'>('operations_manager');
  const [newNotes, setNewNotes] = useState('');

  const statusWorkflow: { key: string; label: string; count: number }[] = [
    { key: 'all', label: 'All Bookings', count: bookings.length },
    { key: 'requested', label: '1. Requested', count: bookings.filter((b) => b.status === 'requested').length },
    { key: 'under_review', label: '2. Under Review', count: bookings.filter((b) => b.status === 'under_review').length },
    { key: 'approved', label: '3. Approved', count: bookings.filter((b) => b.status === 'approved').length },
    { key: 'room_assigned', label: '4. Room Assigned', count: bookings.filter((b) => b.status === 'room_assigned').length },
    { key: 'confirmed', label: '5. Confirmed', count: bookings.filter((b) => b.status === 'confirmed').length },
    { key: 'checked_in', label: '6. Checked In', count: bookings.filter((b) => b.status === 'checked_in').length },
  ];

  const clientBookedCount = bookings.filter((b) => b.source === 'client_portal' || !b.source).length;
  const managerBookedCount = bookings.filter((b) => b.source && b.source !== 'client_portal').length;

  const filteredBookings = useMemo(() => bookings.filter((b) => {
    if (activeTab !== 'all' && b.status !== activeTab) return false;

    // Source filter
    if (sourceFilter === 'client') {
      if (b.source && b.source !== 'client_portal') return false;
    } else if (sourceFilter === 'manager') {
      if (!b.source || b.source === 'client_portal') return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        b.bookingNumber.toLowerCase().includes(q) ||
        b.clientName.toLowerCase().includes(q) ||
        b.propertyName.toLowerCase().includes(q) ||
        b.clientEmail.toLowerCase().includes(q)
      );
    }
    return true;
  }), [bookings, activeTab, sourceFilter, searchQuery]);

  const pagedBookings = useMemo(() => {
    const start = (pageIndex - 1) * pageSize;
    return filteredBookings.slice(start, start + pageSize);
  }, [filteredBookings, pageIndex, pageSize]);

  const availableRoomsForProperty = selectedBooking
    ? rooms.filter((r) => r.propertyId === selectedBooking.propertyId && r.status === 'available')
    : [];

  const availableRoomsForNewBooking = rooms.filter(
    (r) => r.propertyId === newPropertyId && r.status === 'available'
  );

  const openDetailsDrawer = (booking: Booking) => {
    setSelectedBooking(booking);
    setDrawerOpen(true);
  };

  const closeDetailsDrawer = () => {
    setDrawerOpen(false);
    setSelectedBooking(null);
  };

  const promptApprove = (booking: Booking) => {
    setConfirmApproveBooking(booking);
  };

  const handleConfirmApproval = () => {
    if (!confirmApproveBooking) return;
    const bookingId = confirmApproveBooking.id;

    updateBookingStatus(bookingId, 'approved', 'Tenancy application formally approved by Operations Manager');
    success('Tenancy Approved', `Application for ${confirmApproveBooking.clientName} has been approved.`);

    if (selectedBooking && selectedBooking.id === bookingId) {
      setSelectedBooking((prev) => (prev ? { ...prev, status: 'approved' } : null));
    }
    setConfirmApproveBooking(null);
  };

  const handleReject = (bookingId: string) => {
    updateBookingStatus(bookingId, 'rejected', 'Application declined after review');
    info('Booking Rejected', 'Reservation status updated to rejected.');
    if (selectedBooking && selectedBooking.id === bookingId) {
      setSelectedBooking((prev) => (prev ? { ...prev, status: 'rejected' } : null));
    }
  };

  const handleConfirmCheckin = (bookingId: string) => {
    updateBookingStatus(bookingId, 'checked_in', 'Keys handed over and move-in inventory report signed');
    success('Resident Checked In', 'Tenant successfully checked in.');
    if (selectedBooking && selectedBooking.id === bookingId) {
      setSelectedBooking((prev) => (prev ? { ...prev, status: 'checked_in' } : null));
    }
  };

  const handleAssignRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking || !selectedRoomId) return;

    assignRoomToBooking(selectedBooking.id, selectedRoomId);
    setAssignRoomModalOpen(false);
    success('Room Assigned', `Unit assigned to ${selectedBooking.clientName}.`);

    const assignedRoom = rooms.find((r) => r.id === selectedRoomId);
    if (selectedBooking && assignedRoom) {
      setSelectedBooking((prev) =>
        prev
          ? {
              ...prev,
              status: 'room_assigned',
              roomId: assignedRoom.id,
              roomNumber: assignedRoom.roomNumber,
            }
          : null
      );
    }
  };

  const handleCreateBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let clientName = newClientName.trim();
    let clientEmail = newClientEmail.trim();
    let clientPhone = newClientPhone.trim();
    let clientId = `client-new-${Date.now()}`;

    if (newClientMode === 'existing') {
      const existingClient = clients.find((c) => c.id === selectedClientId);
      if (existingClient) {
        clientName = existingClient.name;
        clientEmail = existingClient.email;
        clientPhone = existingClient.phone;
        clientId = existingClient.id;
      }
    }

    if (!clientName || !clientEmail) {
      error('Validation Error', 'Please specify client name and email address.');
      return;
    }

    const targetProp = properties.find((p) => p.id === newPropertyId) || properties[0];
    const targetRentalType = rentalTypes.find((rt) => rt.id === newRentalTypeId) || rentalTypes[0];
    const targetRoom = rooms.find((r) => r.id === newRoomId);

    const createdBooking = addBooking({
      clientId,
      clientName,
      clientEmail,
      clientPhone,
      propertyId: targetProp.id,
      propertyName: targetProp.name,
      roomId: targetRoom ? targetRoom.id : undefined,
      roomNumber: targetRoom ? targetRoom.roomNumber : undefined,
      rentalTypeId: targetRentalType.id,
      rentalTypeName: targetRentalType.name,
      moveInDate: newMoveInDate,
      moveOutDate: newMoveOutDate,
      monthlyRent: Number(newMonthlyRent),
      deposit: Number(newDeposit),
      status: targetRoom ? 'room_assigned' : 'under_review',
      notes: newNotes,
      source: newSource,
      agentName: 'Operations Direct Reservation',
    });

    success(
      'Reservation Created',
      `New booking ${createdBooking.bookingNumber} for ${clientName} created successfully.`
    );

    setCreateDrawerOpen(false);
    // Reset form
    setNewClientName('');
    setNewClientEmail('');
    setNewClientPhone('');
    setNewNotes('');
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 px-2.5 py-1 rounded-full border border-brand-200 dark:border-brand-800 mb-1">
            <CalendarCheck2 className="w-3.5 h-3.5" />
            <span>Tenancy & Reservation Pipeline</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 dark:text-white">
            Booking & Reservation Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Create direct manager reservations, review client applications, approve leases, and assign units.
          </p>
        </div>

        <button
          onClick={() => setCreateDrawerOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md hover:shadow-glow transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Booking</span>
        </button>
      </div>

      {/* Visual 6-Stage Workflow Pipeline Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800 text-xs">
        {statusWorkflow.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === tab.key
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === tab.key
                  ? 'bg-white text-brand-700 font-extrabold'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filter / Search / Source Filter Bar */}
      <div className="glass-card p-4 rounded-2xl shadow-soft flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by booking #, client name, email, or estate..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Source Pills Filter */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
          <button
            onClick={() => setSourceFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              sourceFilter === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Sources ({bookings.length})
          </button>
          <button
            onClick={() => setSourceFilter('client')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              sourceFilter === 'client'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Client Self-Booked ({clientBookedCount})</span>
          </button>
          <button
            onClick={() => setSourceFilter('manager')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              sourceFilter === 'manager'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-brand-700 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Manager Created ({managerBookedCount})</span>
          </button>
        </div>
      </div>

      {/* Bookings Ledger Table */}
      <div className="glass-card rounded-3xl shadow-soft overflow-hidden border">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold text-[10px] bg-slate-50/50 dark:bg-slate-800/30">
                <th className="py-3.5 px-6">Booking #</th>
                <th className="py-3.5 px-4">Applicant / Tenant</th>
                <th className="py-3.5 px-4">Origin / Source</th>
                <th className="py-3.5 px-4">Target Property</th>
                <th className="py-3.5 px-4">Unit Assigned</th>
                <th className="py-3.5 px-4">Move-In</th>
                <th className="py-3.5 px-4">Rent</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredBookings.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-14 text-center text-slate-400">
                    <CalendarCheck2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="font-semibold">No bookings found matching your current filter criteria.</p>
                  </td>
                </tr>
              )}
              {pagedBookings.map((b) => {
                const isClientPortal = !b.source || b.source === 'client_portal';

                return (
                  <tr
                    key={b.id}
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                      isClientPortal ? 'bg-emerald-50/20 dark:bg-emerald-950/10' : ''
                    }`}
                  >
                    {/* Booking Number */}
                    <td className="py-4 px-6 font-bold font-mono text-slate-900 dark:text-white">
                      <button
                        onClick={() => openDetailsDrawer(b)}
                        className="text-left font-bold font-mono text-brand-600 dark:text-brand-400 hover:underline"
                      >
                        {b.bookingNumber}
                      </button>
                    </td>

                    {/* Applicant / Tenant */}
                    <td className="py-4 px-4">
                      <p className="font-bold text-slate-900 dark:text-white">{b.clientName}</p>
                      <p className="text-[10px] text-slate-500">{b.clientEmail}</p>
                    </td>

                    {/* Booking Origin / Highlight Tag */}
                    <td className="py-4 px-4">
                      {isClientPortal ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-[10px] shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <Globe className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Client Self-Booked</span>
                        </span>
                      ) : b.source === 'walk_in' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold text-[10px]">
                          <UserCheck className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          <span>Walk-in Inquiry</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold text-[10px]">
                          <UserCheck className="w-3 h-3 text-brand-500" />
                          <span>Manager Created</span>
                        </span>
                      )}
                    </td>

                    {/* Property */}
                    <td className="py-4 px-4 font-bold text-slate-900 dark:text-white">{b.propertyName}</td>

                    {/* Assigned Unit */}
                    <td className="py-4 px-4">
                      {b.roomNumber ? (
                        <span className="font-extrabold text-brand-600 dark:text-brand-400 font-mono">
                          Unit {b.roomNumber}
                        </span>
                      ) : (
                        <span className="text-amber-500 font-semibold italic text-[11px] bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md">
                          Unassigned
                        </span>
                      )}
                    </td>

                    {/* Move in date */}
                    <td className="py-4 px-4 font-medium">{b.moveInDate}</td>

                    {/* Rent */}
                    <td className="py-4 px-4 font-extrabold text-brand-600 dark:text-brand-400 font-mono">
                      ${b.monthlyRent}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      <Badge
                        variant={
                          b.status === 'checked_in'
                            ? 'success'
                            : b.status === 'approved' || b.status === 'room_assigned' || b.status === 'confirmed'
                            ? 'info'
                            : b.status === 'under_review' || b.status === 'requested'
                            ? 'warning'
                            : 'danger'
                        }
                        size="sm"
                        dot
                      >
                        {b.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => openDetailsDrawer(b)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 hover:text-brand-600 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Details</span>
                      </button>

                      {(b.status === 'requested' || b.status === 'under_review') && (
                        <button
                          onClick={() => promptApprove(b)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors inline-flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                      )}

                      {b.status === 'approved' && !b.roomId && (
                        <button
                          onClick={() => {
                            setSelectedBooking(b);
                            setAssignRoomModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-xs transition-colors"
                        >
                          Assign Unit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={pageIndex}
          totalItems={filteredBookings.length}
          pageSize={pageSize}
          onPageChange={(p) => setPageIndex(p)}
          onPageSizeChange={(s) => { setPageSize(s); setPageIndex(1); }}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 1. SLIDE-IN SIDEBAR PANEL: BOOKING DETAILS & WORKFLOW       */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div
        className={`fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300 ${
          drawerOpen && selectedBooking ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeDetailsDrawer}
      />

      <aside
        className={`fixed right-0 top-0 h-full z-50 w-full max-w-xl bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out ${
          drawerOpen && selectedBooking ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {selectedBooking && (
          <>
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-bold text-brand-600 dark:text-brand-400">
                    {selectedBooking.bookingNumber}
                  </span>
                  {selectedBooking.source === 'client_portal' || !selectedBooking.source ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-extrabold text-[10px]">
                      🌐 Client Self-Booked
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-extrabold text-[10px]">
                      👤 Manager Created
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-extrabold font-display text-slate-900 dark:text-white">
                  {selectedBooking.propertyName}
                </h2>
              </div>
              <button
                onClick={closeDetailsDrawer}
                className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 text-xs text-slate-700 dark:text-slate-300">
              {/* Status Banner */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Current Pipeline Stage</span>
                  <p className="text-base font-extrabold text-slate-900 dark:text-white capitalize">
                    {selectedBooking.status.replace('_', ' ')}
                  </p>
                </div>
                <Badge
                  variant={
                    selectedBooking.status === 'checked_in'
                      ? 'success'
                      : selectedBooking.status === 'approved' || selectedBooking.status === 'room_assigned'
                      ? 'info'
                      : selectedBooking.status === 'under_review' || selectedBooking.status === 'requested'
                      ? 'warning'
                      : 'danger'
                  }
                  size="md"
                  dot
                >
                  {selectedBooking.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>

              {/* Applicant Profile Card */}
              {(() => {
                const matchedClient = clients.find(
                  (c) =>
                    c.id === selectedBooking.clientId ||
                    c.email.toLowerCase() === selectedBooking.clientEmail.toLowerCase()
                );

                return (
                  <div className="glass-card p-5 rounded-2xl border space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Prospective / Resident Information
                      </h3>
                      {matchedClient && (
                        <Badge
                          variant={
                            matchedClient.status === 'active'
                              ? 'success'
                              : matchedClient.status === 'suspended'
                              ? 'danger'
                              : matchedClient.status === 'former'
                              ? 'neutral'
                              : 'warning'
                          }
                          size="sm"
                          dot
                        >
                          {matchedClient.status.toUpperCase()} RESIDENT
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-1">
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">Full Name</span>
                        <p className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                          {selectedBooking.clientName}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">Contact Phone</span>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {selectedBooking.clientPhone}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">Email Address</span>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          {selectedBooking.clientEmail}
                        </p>
                      </div>
                    </div>

                    {matchedClient && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                        <Link
                          to={`/operations/clients/${matchedClient.id}`}
                          className="text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 inline-flex items-center gap-1"
                        >
                          <span>View Client Dossier</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>

                        {matchedClient.status === 'active' ? (
                          <button
                            onClick={() => {
                              updateClientStatus(
                                matchedClient.id,
                                'inactive',
                                `Deactivated from Booking ${selectedBooking.bookingNumber}`
                              );
                              info('Client Deactivated', `${matchedClient.name} marked as Inactive.`);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-300 text-[10px] font-bold border border-rose-200 dark:border-rose-800 transition-colors inline-flex items-center gap-1"
                          >
                            <UserX className="w-3 h-3" />
                            <span>Deactivate</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              updateClientStatus(
                                matchedClient.id,
                                'active',
                                `Re-activated via Booking ${selectedBooking.bookingNumber}`
                              );
                              success('Client Reactivated', `${matchedClient.name} is now Active.`);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800 transition-colors inline-flex items-center gap-1"
                          >
                            <UserCheck className="w-3 h-3" />
                            <span>Reactivate</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Property & Accommodation Details */}
              <div className="glass-card p-5 rounded-2xl border space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Accommodation & Rental Tier
                </h3>
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Assigned Unit</span>
                    <p className="font-extrabold text-sm text-brand-600 dark:text-brand-400 mt-0.5">
                      {selectedBooking.roomNumber ? `Unit ${selectedBooking.roomNumber}` : 'Pending Assignment'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Rental Tier</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                      {selectedBooking.rentalTypeName}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Target Move-In Date</span>
                    <p className="font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-brand-500" />
                      {selectedBooking.moveInDate}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Monthly Rent</span>
                    <p className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono text-sm mt-0.5">
                      ${selectedBooking.monthlyRent}/mo
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Security Deposit</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 font-mono mt-0.5">
                      ${selectedBooking.deposit}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Lease Reference</span>
                    <p className="font-mono text-slate-500 mt-0.5">1-Year Standard Tenancy</p>
                  </div>
                </div>
              </div>

              {/* Special Notes */}
              {selectedBooking.notes && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                  <span className="font-bold text-[10px] uppercase text-amber-800 dark:text-amber-300">
                    Application Notes & Special Terms:
                  </span>
                  <p className="mt-1 text-slate-700 dark:text-slate-300 leading-relaxed">
                    {selectedBooking.notes}
                  </p>
                </div>
              )}

              {/* Audit Timeline */}
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                  Tenancy Workflow History
                </h4>
                <div className="space-y-2">
                  {selectedBooking.timeline.map((step, idx) => (
                    <div
                      key={idx}
                      className="flex items-start justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-brand-500" />
                          <p className="font-bold capitalize text-slate-900 dark:text-white">
                            {step.status.replace('_', ' ')}
                          </p>
                        </div>
                        {step.note && <p className="text-[11px] text-slate-500 mt-0.5 ml-4">{step.note}</p>}
                        <p className="text-[10px] text-slate-400 ml-4 mt-0.5 font-medium">By: {step.updatedBy}</p>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">{step.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between gap-3">
              {(selectedBooking.status === 'requested' || selectedBooking.status === 'under_review') && (
                <>
                  <button
                    onClick={() => handleReject(selectedBooking.id)}
                    className="px-4 py-2.5 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold text-xs transition-colors"
                  >
                    Decline Application
                  </button>

                  <button
                    onClick={() => promptApprove(selectedBooking)}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve Tenancy Application</span>
                  </button>
                </>
              )}

              {selectedBooking.status === 'approved' && !selectedBooking.roomId && (
                <button
                  onClick={() => setAssignRoomModalOpen(true)}
                  className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <DoorOpen className="w-4 h-4" />
                  <span>Assign Unit & Prepare Lease</span>
                </button>
              )}

              {selectedBooking.status === 'room_assigned' && (
                <button
                  onClick={() => handleConfirmCheckin(selectedBooking.id)}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Key className="w-4 h-4" />
                  <span>Confirm Move-In & Key Handover</span>
                </button>
              )}

              {selectedBooking.status === 'checked_in' && (
                <div className="w-full text-center py-1 text-emerald-600 font-bold flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Tenant Currently Resident & Checked In</span>
                </div>
              )}
            </div>
          </>
        )}
      </aside>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 2. SLIDE-IN SIDEBAR PANEL: ADD NEW DIRECT BOOKING           */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div
        className={`fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300 ${
          createDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setCreateDrawerOpen(false)}
      />

      <aside
        className={`fixed right-0 top-0 h-full z-50 w-full max-w-xl bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out ${
          createDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 text-brand-600 dark:text-brand-400 font-bold text-xs mb-0.5">
              <Plus className="w-3.5 h-3.5" />
              <span>Operations Manager Portal</span>
            </div>
            <h2 className="text-lg font-extrabold font-display text-slate-900 dark:text-white">
              Create New Direct Reservation
            </h2>
          </div>
          <button
            onClick={() => setCreateDrawerOpen(false)}
            className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCreateBookingSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-5 text-xs">
          {/* Reservation Origin */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Reservation Channel / Source *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setNewSource('operations_manager')}
                className={`py-2 px-3 rounded-xl border text-center font-bold text-xs transition-all ${
                  newSource === 'operations_manager'
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600'
                }`}
              >
                👤 Manager Direct
              </button>
              <button
                type="button"
                onClick={() => setNewSource('walk_in')}
                className={`py-2 px-3 rounded-xl border text-center font-bold text-xs transition-all ${
                  newSource === 'walk_in'
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600'
                }`}
              >
                🚶 Walk-in Office
              </button>
              <button
                type="button"
                onClick={() => setNewSource('phone_inquiry')}
                className={`py-2 px-3 rounded-xl border text-center font-bold text-xs transition-all ${
                  newSource === 'phone_inquiry'
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600'
                }`}
              >
                📞 Phone Inquiry
              </button>
            </div>
          </div>

          {/* Client Selection Mode */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Applicant Information *
              </label>
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setNewClientMode('new')}
                  className={`px-2.5 py-1 rounded-lg font-bold ${
                    newClientMode === 'new'
                      ? 'bg-slate-900 dark:bg-brand-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  New Applicant
                </button>
                <button
                  type="button"
                  onClick={() => setNewClientMode('existing')}
                  className={`px-2.5 py-1 rounded-lg font-bold ${
                    newClientMode === 'existing'
                      ? 'bg-slate-900 dark:bg-brand-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  Existing Client
                </button>
              </div>
            </div>

            {newClientMode === 'existing' ? (
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">Select Client</label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                >
                  <option value="">-- Choose Existing Client --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Arthur Rutayisire"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="client@domain.com"
                      value={newClientEmail}
                      onChange={(e) => setNewClientEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+250 788 000 000"
                      value={newClientPhone}
                      onChange={(e) => setNewClientPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Property & Rental Tier */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Estate & Accommodation Details *
            </label>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">Target Property *</label>
                <select
                  value={newPropertyId}
                  onChange={(e) => {
                    setNewPropertyId(e.target.value);
                    setNewRoomId('');
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">Rental Tier Package *</label>
                <select
                  value={newRentalTypeId}
                  onChange={(e) => setNewRentalTypeId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                >
                  {rentalTypes.map((rt) => (
                    <option key={rt.id} value={rt.id}>
                      {rt.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Optional Immediate Room Assignment */}
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Assign Unit Now (Optional)
              </label>
              <select
                value={newRoomId}
                onChange={(e) => {
                  setNewRoomId(e.target.value);
                  const found = rooms.find((r) => r.id === e.target.value);
                  if (found) {
                    setNewMonthlyRent(found.monthlyRent);
                    setNewDeposit(found.deposit);
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
              >
                <option value="">-- Assign Later (Pending Review) --</option>
                {availableRoomsForNewBooking.map((r) => (
                  <option key={r.id} value={r.id}>
                    Unit {r.roomNumber} (Floor {r.floor} • {r.bedrooms} Bed • ${r.monthlyRent}/mo)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Lease Dates & Pricing */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Lease Dates & Financials
            </label>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">Move-In Date *</label>
                <input
                  type="date"
                  required
                  value={newMoveInDate}
                  onChange={(e) => setNewMoveInDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">Expected Move-Out</label>
                <input
                  type="date"
                  value={newMoveOutDate}
                  onChange={(e) => setNewMoveOutDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">Monthly Rent ($) *</label>
                <input
                  type="number"
                  required
                  value={newMonthlyRent}
                  onChange={(e) => setNewMonthlyRent(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">Security Deposit ($) *</label>
                <input
                  type="number"
                  required
                  value={newDeposit}
                  onChange={(e) => setNewDeposit(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Internal Notes & Lease Terms
            </label>
            <textarea
              rows={3}
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="e.g. Walk-in corporate executive. Requesting invoice billed directly to embassy..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
            />
          </div>

          {/* Submit */}
          <div className="pt-3">
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md hover:shadow-glow transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create & Register Reservation</span>
            </button>
          </div>
        </form>
      </aside>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 3. CONFIRM APPROVAL MODAL (SAFEGUARD CONFIRMATION)          */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {confirmApproveBooking && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setConfirmApproveBooking(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white font-display">
                Confirm Tenancy Application Approval
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to approve the reservation for{' '}
                <strong className="text-slate-900 dark:text-white font-bold">
                  {confirmApproveBooking.clientName}
                </strong>{' '}
                at{' '}
                <span className="text-brand-600 dark:text-brand-400 font-bold">
                  {confirmApproveBooking.propertyName}
                </span>
                ?
              </p>
            </div>

            {/* Quick Summary Card */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Booking Reference:</span>
                <span className="font-mono font-bold">{confirmApproveBooking.bookingNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Move-In Date:</span>
                <span className="font-bold">{confirmApproveBooking.moveInDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Agreed Monthly Rent:</span>
                <span className="font-bold text-emerald-600">${confirmApproveBooking.monthlyRent}/mo</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 italic text-center">
              Approving moves this booking to the room assignment and lease generation stage.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmApproveBooking(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApproval}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Confirm & Approve</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 4. ROOM ASSIGNMENT MODAL                                    */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {selectedBooking && assignRoomModalOpen && (
        <Modal
          isOpen={assignRoomModalOpen}
          onClose={() => setAssignRoomModalOpen(false)}
          title="Assign Unit to Tenant"
          subtitle={`Assigning available unit in ${selectedBooking.propertyName} for ${selectedBooking.clientName}`}
        >
          <form onSubmit={handleAssignRoomSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Select Available Unit in {selectedBooking.propertyName}
              </label>
              {availableRoomsForProperty.length > 0 ? (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {availableRoomsForProperty.map((r) => (
                    <label
                      key={r.id}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedRoomId === r.id
                          ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/60 font-bold'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="roomChoice"
                          checked={selectedRoomId === r.id}
                          onChange={() => setSelectedRoomId(r.id)}
                          className="text-brand-600 focus:ring-brand-500"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            Unit {r.roomNumber} (Floor {r.floor})
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {r.bedrooms} Bed • {r.sizeSqM} m² • {r.furnishingType}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-emerald-600">${r.monthlyRent}/mo</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-rose-500 py-2">
                  No currently available units in {selectedBooking.propertyName}. Please mark a unit available first.
                </p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={!selectedRoomId}
                className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all"
              >
                Confirm Room Assignment
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
