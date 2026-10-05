/**
 * One-off extraction script — NOT part of the app's runtime code. Reads the real mockData.ts
 * arrays (no hand-transcription) and emits a corrected JSON snapshot for the Java
 * LegacySeedRunner to consume. See DATA_MIGRATION_PLAN.md for the full rationale behind every
 * transform below.
 *
 * Run with: npx tsx scripts/extract-legacy-data.ts   (from within frontend/)
 */
import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import {
  mockUsers,
  mockProperties,
  mockBuildings,
  mockRentalTypes,
  mockRooms,
  mockClients,
  mockBookings,
  mockPayments,
  mockExpenses,
  mockRecurringBills,
  mockTechnicians,
  mockPreventiveTasks,
  mockDamages,
  mockWaterMeters,
  mockEmployees,
  mockPayrollRecords,
  mockAgents,
  mockMaintenanceIssues,
  mockActivityLogs,
  mockNotifications,
} from '../src/data/mockData';

const OUT_PATH = '../backend/src/main/resources/legacy-seed/legacy-seed-data.json';

// Fixed reference instant for converting notification relative-time strings ("2 hours ago")
// to absolute timestamps — never Date.now(), so this script is reproducible.
const REFERENCE_INSTANT = new Date('2026-08-18T12:00:00Z');

const FURNISHING_TYPE: Record<string, string> = {
  'Fully Furnished': 'FULLY_FURNISHED',
  'Self Furnished': 'SELF_FURNISHED',
  'Semi-Furnished': 'SEMI_FURNISHED',
  'Executive Luxury': 'EXECUTIVE_LUXURY',
};

const ROOM_STATUS: Record<string, string> = {
  available: 'AVAILABLE',
  reserved: 'RESERVED',
  occupied: 'OCCUPIED',
  maintenance: 'MAINTENANCE',
};

const CLIENT_MATERIAL_CONDITION: Record<string, string> = {
  Excellent: 'EXCELLENT',
  Good: 'GOOD',
  Fair: 'FAIR',
  'Needs Repair': 'NEEDS_REPAIR',
};

const CLIENT_PAYMENT_STATUS: Record<string, string> = { paid: 'PAID', pending: 'PENDING', overdue: 'OVERDUE' };
const CLIENT_STATUS: Record<string, string> = { active: 'ACTIVE', former: 'FORMER', inactive: 'INACTIVE', suspended: 'SUSPENDED' };

const BOOKING_STATUS: Record<string, string> = {
  requested: 'REQUESTED',
  under_review: 'UNDER_REVIEW',
  approved: 'APPROVED',
  room_assigned: 'ROOM_ASSIGNED',
  confirmed: 'CONFIRMED',
  checked_in: 'CHECKED_IN',
  cancelled: 'CANCELLED',
  rejected: 'REJECTED',
  completed: 'COMPLETED',
};

const BOOKING_SOURCE: Record<string, string> = {
  client_portal: 'CLIENT_PORTAL',
  operations_manager: 'OPERATIONS_MANAGER',
  walk_in: 'WALK_IN',
  phone_inquiry: 'PHONE_INQUIRY',
  agent_referral: 'AGENT_REFERRAL',
};

const AGENT_STATUS: Record<string, string> = { Active: 'ACTIVE', Inactive: 'INACTIVE' };
const AGENT_DEAL_STATUS: Record<string, string> = { Paid: 'PAID', Pending: 'PENDING', Processing: 'PROCESSING' };
const PAYOUT_METHOD: Record<string, string> = { 'Mobile Money': 'MOBILE_MONEY', 'Bank Transfer': 'BANK_TRANSFER', Cash: 'CASH' };

const PAYMENT_TYPE: Record<string, string> = {
  rent: 'RENT', deposit: 'DEPOSIT', utility: 'UTILITY', penalty: 'PENALTY', maintenance: 'MAINTENANCE', other: 'OTHER',
};
const PAYMENT_METHOD: Record<string, string> = {
  'Mobile Money': 'MOBILE_MONEY', 'Bank Transfer': 'BANK_TRANSFER', 'Credit Card': 'CREDIT_CARD', Cash: 'CASH',
};
const PAYMENT_STATUS: Record<string, string> = { paid: 'PAID', pending: 'PENDING', overdue: 'OVERDUE', cancelled: 'CANCELLED' };

const EXPENSE_CATEGORY: Record<string, string> = {
  Maintenance: 'MAINTENANCE', Cleaning: 'CLEANING', Security: 'SECURITY', Utilities: 'UTILITIES',
  Repairs: 'REPAIRS', Supplies: 'SUPPLIES', Staff: 'STAFF', Landscaping: 'LANDSCAPING', Other: 'OTHER',
};
const EXPENSE_STATUS: Record<string, string> = { paid: 'PAID', pending: 'PENDING' };

const RECURRING_BILL_CATEGORY: Record<string, string> = {
  Electricity: 'ELECTRICITY', Water: 'WATER', Internet: 'INTERNET', Security: 'SECURITY',
  Cleaning: 'CLEANING', 'Maintenance Contract': 'MAINTENANCE_CONTRACT', 'Garbage Collection': 'GARBAGE_COLLECTION',
};
const BILL_FREQUENCY: Record<string, string> = { Monthly: 'MONTHLY', Quarterly: 'QUARTERLY', 'Bi-Weekly': 'BI_WEEKLY', Annual: 'ANNUAL' };
const RECURRING_BILL_STATUS: Record<string, string> = { paid: 'PAID', upcoming: 'UPCOMING', overdue: 'OVERDUE' };

const TECHNICIAN_SPECIALIZATION: Record<string, string> = {
  Plumber: 'PLUMBER', Electrician: 'ELECTRICIAN', Carpenter: 'CARPENTER', HVAC: 'HVAC',
  Painter: 'PAINTER', 'IT & Security': 'IT_SECURITY', 'General Maintenance': 'GENERAL_MAINTENANCE',
};
const TECHNICIAN_AVAILABILITY: Record<string, string> = { Available: 'AVAILABLE', 'On Job': 'ON_JOB', Unavailable: 'UNAVAILABLE' };
const TECH_PAYOUT_METHOD: Record<string, string> = { 'Mobile Money': 'MOBILE_MONEY', 'Bank Transfer': 'BANK_TRANSFER', Cash: 'CASH' };
const TECH_DOCUMENT_TYPE: Record<string, string> = {
  License: 'LICENSE', Certification: 'CERTIFICATION', Contract: 'CONTRACT', Insurance: 'INSURANCE', ID: 'ID', Invoice: 'INVOICE', Other: 'OTHER',
};
const TECH_DOCUMENT_STATUS: Record<string, string> = { Valid: 'VALID', Expired: 'EXPIRED', 'Pending Review': 'PENDING_REVIEW' };

const WORK_ORDER_CATEGORY: Record<string, string> = {
  Plumbing: 'PLUMBING', Electrical: 'ELECTRICAL', Carpentry: 'CARPENTRY', HVAC: 'HVAC',
  Painting: 'PAINTING', 'IT & Security': 'IT_SECURITY', General: 'GENERAL',
};
const WORK_ORDER_PRIORITY: Record<string, string> = { Low: 'LOW', Medium: 'MEDIUM', High: 'HIGH', Emergency: 'EMERGENCY' };
const WORK_ORDER_STATUS: Record<string, string> = {
  Dispatched: 'DISPATCHED', 'In Progress': 'IN_PROGRESS', Completed: 'COMPLETED', Cancelled: 'CANCELLED', 'On Hold': 'ON_HOLD',
};
const WORK_ORDER_PAYMENT_STATUS: Record<string, string> = { Unpaid: 'UNPAID', 'Partially Paid': 'PARTIALLY_PAID', Paid: 'PAID' };

const PREVENTIVE_CATEGORY: Record<string, string> = {
  'Common Areas': 'COMMON_AREAS', Corridors: 'CORRIDORS', Staircases: 'STAIRCASES',
  'Compound & Parking': 'COMPOUND_AND_PARKING', 'Lighting Systems': 'LIGHTING_SYSTEMS',
  'Tiles & Floors': 'TILES_AND_FLOORS', 'Walls & Painting': 'WALLS_AND_PAINTING',
  'Windows & Doors': 'WINDOWS_AND_DOORS', 'Handrails & Balconies': 'HANDRAILS_AND_BALCONIES',
  Walkways: 'WALKWAYS', 'Waste Management': 'WASTE_MANAGEMENT', 'Electrical System': 'ELECTRICAL_SYSTEM',
  'Roof & Drainage': 'ROOF_AND_DRAINAGE', 'Pest Control': 'PEST_CONTROL', 'Garden & Landscaping': 'GARDEN_AND_LANDSCAPING',
};
const PREVENTIVE_FREQUENCY: Record<string, string> = {
  Weekly: 'WEEKLY', 'Bi-Weekly': 'BI_WEEKLY', Monthly: 'MONTHLY', Quarterly: 'QUARTERLY', Custom: 'CUSTOM',
};
const INSPECTION_STATUS: Record<string, string> = {
  pass: 'PASS', failed: 'FAILED', needs_attention: 'NEEDS_ATTENTION', not_applicable: 'NOT_APPLICABLE', pending: 'PENDING',
};

const RESPONSIBLE_PARTY: Record<string, string> = {
  Tenant: 'TENANT', 'Property Owner': 'PROPERTY_OWNER', 'Wear & Tear': 'WEAR_AND_TEAR', Contractor: 'CONTRACTOR',
};
const DAMAGE_STATUS: Record<string, string> = {
  'Pending Review': 'PENDING_REVIEW', 'In Repair': 'IN_REPAIR', Resolved: 'RESOLVED', Disputed: 'DISPUTED',
};
const WATER_PAYMENT_STATUS: Record<string, string> = { paid: 'PAID', pending: 'PENDING', overdue: 'OVERDUE' };

const DEPARTMENT: Record<string, string> = {
  Operations: 'OPERATIONS', Maintenance: 'MAINTENANCE', Housekeeping: 'HOUSEKEEPING', Security: 'SECURITY', Finance: 'FINANCE', Management: 'MANAGEMENT',
};
const EMPLOYMENT_STATUS: Record<string, string> = { 'Full-Time': 'FULL_TIME', 'Part-Time': 'PART_TIME', Contract: 'CONTRACT' };
const EMPLOYEE_STATUS: Record<string, string> = { active: 'ACTIVE', on_leave: 'ON_LEAVE', suspended: 'SUSPENDED', terminated: 'TERMINATED' };
const EMPLOYEE_DOCUMENT_TYPE: Record<string, string> = {
  'Employment Contract': 'EMPLOYMENT_CONTRACT', 'National ID / Passport': 'NATIONAL_ID_PASSPORT',
  'Criminal Record Clearance': 'CRIMINAL_RECORD_CLEARANCE', 'Health Insurance': 'HEALTH_INSURANCE',
  'Certificate / Degree': 'CERTIFICATE_DEGREE', Other: 'OTHER',
};
const EMPLOYEE_DOCUMENT_STATUS: Record<string, string> = { Verified: 'VERIFIED', 'Pending Review': 'PENDING_REVIEW', Expired: 'EXPIRED' };
const TASK_PRIORITY: Record<string, string> = { High: 'HIGH', Medium: 'MEDIUM', Low: 'LOW' };
const DAILY_TASK_STATUS: Record<string, string> = { Pending: 'PENDING', 'In Progress': 'IN_PROGRESS', Completed: 'COMPLETED', Rejected: 'REJECTED' };
const EMPLOYEE_DAMAGE_STATUS: Record<string, string> = { Investigating: 'INVESTIGATING', Deducted: 'DEDUCTED', Forgiven: 'FORGIVEN', Settled: 'SETTLED' };

const PAYROLL_PAYMENT_STATUS: Record<string, string> = { Paid: 'PAID', Processing: 'PROCESSING', Pending: 'PENDING' };

const ISSUE_CATEGORY: Record<string, string> = {
  Plumbing: 'PLUMBING', Electrical: 'ELECTRICAL', Furniture: 'FURNITURE', Appliances: 'APPLIANCES', HVAC: 'HVAC', Structural: 'STRUCTURAL', Other: 'OTHER',
};
const ISSUE_PRIORITY: Record<string, string> = { Low: 'LOW', Medium: 'MEDIUM', High: 'HIGH', Emergency: 'EMERGENCY' };
const ISSUE_STATUS: Record<string, string> = {
  Submitted: 'SUBMITTED', Reviewed: 'REVIEWED', Assigned: 'ASSIGNED', 'In Progress': 'IN_PROGRESS', Resolved: 'RESOLVED', Closed: 'CLOSED',
};

const ACTIVITY_TYPE: Record<string, string> = { info: 'INFO', success: 'SUCCESS', warning: 'WARNING', critical: 'CRITICAL' };
const NOTIFICATION_TYPE: Record<string, string> = {
  booking: 'BOOKING', payment: 'PAYMENT', maintenance: 'MAINTENANCE', system: 'SYSTEM', payroll: 'PAYROLL', alert: 'ALERT',
};
const USER_ROLE: Record<string, string> = {
  client: 'CLIENT', operations: 'OPERATIONS', owner: 'OWNER', household: 'HOUSEHOLD', admin: 'ADMIN',
};

function map(dict: Record<string, string>, value: string | undefined, context: string): string | undefined {
  if (value === undefined) return undefined;
  const mapped = dict[value];
  if (!mapped) throw new Error(`Unmapped enum value "${value}" in ${context}`);
  return mapped;
}

function toDateTimeIso(spaceSeparated: string): string {
  // "2025-08-20 10:15" -> "2025-08-20T10:15:00Z"
  return spaceSeparated.replace(' ', 'T') + ':00Z';
}

function datePartOf(spaceSeparated: string): string {
  return spaceSeparated.split(' ')[0];
}

// ---- Rooms are built first since many other entities re-derive propertyId from roomId ----
const roomById = new Map(mockRooms.map((r) => [r.id, r]));

function realPropertyIdForRoom(roomId: string | undefined, context: string): string | undefined {
  if (!roomId) return undefined;
  const room = roomById.get(roomId);
  if (!room) throw new Error(`Unknown roomId "${roomId}" referenced by ${context}`);
  return room.propertyId;
}

// Decisions D1/D2 (DATA_MIGRATION_PLAN.md section 7): room-05 and room-10 are the current
// tenancy of client-04 and client-05 respectively — the room's own stale mock status/missing
// currentClientId is what's wrong, not the client record. Overridden here, not in mockData.ts.
const ROOM_OVERRIDES: Record<string, { status: string; currentClientLegacyId: string }> = {
  'room-05': { status: 'OCCUPIED', currentClientLegacyId: 'client-04' },
  'room-10': { status: 'OCCUPIED', currentClientLegacyId: 'client-05' },
};

const rooms = mockRooms.map((r) => {
  const override = ROOM_OVERRIDES[r.id];
  return {
    legacyId: r.id,
    propertyLegacyId: r.propertyId,
    buildingLegacyId: r.buildingId,
    roomNumber: r.roomNumber,
    floor: r.floor,
    sizeSqM: r.sizeSqM,
    bedrooms: r.bedrooms,
    bathrooms: r.bathrooms,
    furnishingType: map(FURNISHING_TYPE, r.furnishingType, `room ${r.id}`),
    monthlyRent: r.monthlyRent,
    deposit: r.deposit,
    status: override ? override.status : map(ROOM_STATUS, r.status, `room ${r.id}`),
    currentClientLegacyId: override ? override.currentClientLegacyId : r.currentClientId ?? null,
    virtualTourUrl: r.virtualTourUrl ?? null,
    description: r.description,
    amenities: r.amenities,
    utilitiesIncluded: r.utilitiesIncluded,
    rules: r.rules,
    images: r.images,
  };
});

// ---- Users ----
const users = mockUsers.map((u) => ({
  legacyId: u.id,
  name: u.name,
  email: u.email,
  phone: u.phone ?? null,
  role: map(USER_ROLE, u.role, `user ${u.id}`),
  title: u.title ?? null,
  avatarUrl: u.avatar ?? null,
  clientLegacyId: u.clientId ?? null,
  // Issue #6: admin/emp-02 are the same person (Diane Umutoni, admin@panther.rw) but the mock
  // user record was never linked — fixed here, not a transcription bug.
  employeeLegacyId: u.employeeId ?? (u.role === 'admin' ? 'emp-02' : null),
  password: 'password@123',
  mustChangePassword: false,
}));

// ---- Properties / Buildings ----
const properties = mockProperties.map((p) => ({
  legacyId: p.id,
  name: p.name,
  code: p.code,
  location: p.location,
  neighborhood: p.neighborhood,
  city: p.city,
  address: p.address,
  description: p.description,
  rating: p.rating,
  reviewCount: p.reviewCount,
  featured: p.featured,
  yearBuilt: p.yearBuilt,
  monthlyRevenueEstimate: p.monthlyRevenueEstimate,
  images: p.images,
  amenities: p.amenities,
}));

const buildings = mockBuildings.map((b) => ({
  legacyId: b.id,
  propertyLegacyId: b.propertyId,
  name: b.name,
  floorsCount: b.floorsCount,
}));

// ---- Rental types ----
const rentalTypes = mockRentalTypes.map((rt) => ({
  legacyId: rt.id,
  name: map(FURNISHING_TYPE, rt.name, `rental type ${rt.id}`),
  description: rt.description,
  priceMultiplier: rt.priceMultiplier,
  status: rt.status === 'active' ? 'ACTIVE' : 'INACTIVE',
  applicablePropertyLegacyIds: rt.applicablePropertyIds,
  includedMaterials: rt.includedMaterials.map((m) => ({
    name: m.name,
    quantity: m.quantity,
    condition: m.condition,
    category: m.category,
  })),
}));

// ---- Clients ----
// Issue #2 + D1/D2: propertyLegacyId is ALWAYS re-derived from the client's real currentRoomId,
// never trusted from the client's own (sometimes fake/stale) currentPropertyId field.
const clients = mockClients.map((c) => ({
  legacyId: c.id,
  name: c.name,
  email: c.email,
  phone: c.phone,
  avatarUrl: c.avatar,
  identificationNumber: c.identificationNumber,
  nationality: c.nationality,
  occupation: c.occupation ?? null,
  employer: c.employer ?? null,
  emergencyContact: c.emergencyContact,
  currentRoomLegacyId: c.currentRoomId,
  currentPropertyLegacyId: realPropertyIdForRoom(c.currentRoomId, `client ${c.id}`),
  rentalType: map(FURNISHING_TYPE, c.rentalType, `client ${c.id}`),
  moveInDate: c.moveInDate,
  leaseExpiryDate: c.leaseExpiryDate,
  monthlyRent: c.monthlyRent,
  depositPaid: c.depositPaid,
  paymentStatus: map(CLIENT_PAYMENT_STATUS, c.paymentStatus, `client ${c.id}`),
  status: map(CLIENT_STATUS, c.status, `client ${c.id}`),
  deactivationReason: c.deactivationReason ?? null,
  deactivatedDate: c.deactivatedDate ?? null,
  notes: c.notes ?? null,
  materials: c.materials.map((m) => ({
    name: m.name,
    quantity: m.quantity,
    condition: map(CLIENT_MATERIAL_CONDITION, m.condition, `client ${c.id} material ${m.id}`),
    assignedDate: m.assignedDate,
    serialNumber: m.serialNumber,
    category: m.category,
  })),
}));
if (mockClients.some((c) => c.documents && c.documents.length > 0)) {
  throw new Error('Expected zero client documents — plan section 8 assumption violated, re-check.');
}

// ---- Bookings ----
// Issue #5: the 3 pending-client bookings map to clientLegacyId=null (the schema's intended
// anonymous-inquiry case), keeping the clientName/clientEmail/clientPhone snapshot fields.
const bookings = mockBookings.map((b) => ({
  legacyId: b.id,
  bookingNumber: b.bookingNumber,
  clientLegacyId: b.clientId.startsWith('client-pending-') ? null : b.clientId,
  clientName: b.clientName,
  clientEmail: b.clientEmail,
  clientPhone: b.clientPhone,
  propertyLegacyId: b.propertyId,
  roomLegacyId: b.roomId ?? null,
  rentalTypeLegacyId: b.rentalTypeId,
  requestedDate: `${b.requestedDate}T00:00:00Z`,
  moveInDate: b.moveInDate,
  moveOutDate: b.moveOutDate ?? null,
  monthlyRent: b.monthlyRent,
  deposit: b.deposit,
  status: map(BOOKING_STATUS, b.status, `booking ${b.id}`),
  notes: b.notes ?? null,
  source: map(BOOKING_SOURCE, b.source, `booking ${b.id}`),
  agentLegacyId: b.agentId ?? null,
  timeline: b.timeline.map((t) => ({
    status: map(BOOKING_STATUS, t.status, `booking ${b.id} timeline`),
    occurredAt: toDateTimeIso(t.timestamp),
    note: t.note ?? null,
    updatedByName: t.updatedBy,
  })),
}));

// ---- Agents ----
const agents = mockAgents.map((a) => ({
  legacyId: a.id,
  name: a.name,
  agency: a.agency ?? null,
  phone: a.phone,
  email: a.email,
  avatarUrl: a.avatar,
  status: map(AGENT_STATUS, a.status, `agent ${a.id}`),
  commissionRatePercent: a.commissionRatePercent,
  paymentMethod: a.paymentMethod ? map(PAYOUT_METHOD, a.paymentMethod, `agent ${a.id}`) : null,
  payoutAccount: a.payoutAccount ?? null,
  notes: a.notes ?? null,
  deals: a.deals.map((d) => ({
    clientName: d.clientName,
    clientEmail: d.clientEmail ?? null,
    clientPhone: d.clientPhone ?? null,
    propertyLegacyId: d.propertyId,
    roomLegacyId: d.roomId ?? null,
    rentalType: d.rentalType ?? null,
    monthlyRent: d.monthlyRent,
    commissionPercentage: d.commissionPercentage,
    commissionAmount: d.commissionAmount,
    dealDate: d.date,
    status: map(AGENT_DEAL_STATUS, d.status, `agent ${a.id} deal ${d.id}`),
    payoutDate: d.payoutDate ?? null,
    payoutReference: d.payoutReference ?? null,
    notes: d.notes ?? null,
  })),
}));

// ---- Payments ----
// Issue #2: propertyLegacyId always re-derived from the payment's real roomId.
const payments = mockPayments.map((p) => ({
  legacyId: p.id,
  invoiceNumber: p.invoiceNumber,
  clientLegacyId: p.clientId,
  propertyLegacyId: realPropertyIdForRoom(p.roomId, `payment ${p.id}`),
  roomLegacyId: p.roomId,
  amount: p.amount,
  date: p.date,
  dueDate: p.dueDate,
  type: map(PAYMENT_TYPE, p.type, `payment ${p.id}`),
  method: map(PAYMENT_METHOD, p.method, `payment ${p.id}`),
  reference: p.reference,
  status: map(PAYMENT_STATUS, p.status, `payment ${p.id}`),
  receiptUrl: p.receiptUrl ?? null,
  notes: p.notes ?? null,
}));

// ---- Expenses ----
// Issue #3b / Decision D3: exp-05 and exp-06 have no roomId to re-derive from; exp-05's
// propertyName exactly matches prop-01's real name (unambiguous); exp-06 shares the same
// fictional "Vision City Executive Villas" name as client-05/pay-06, which resolve to prop-02.
const EXPENSE_PROPERTY_OVERRIDES: Record<string, string> = { 'exp-05': 'prop-01', 'exp-06': 'prop-02' };
const expenses = mockExpenses.map((e) => ({
  legacyId: e.id,
  propertyLegacyId: EXPENSE_PROPERTY_OVERRIDES[e.id] ?? e.propertyId,
  category: map(EXPENSE_CATEGORY, e.category, `expense ${e.id}`),
  description: e.description,
  amount: e.amount,
  date: e.date,
  vendor: e.vendor,
  paymentMethod: map(PAYMENT_METHOD, e.paymentMethod, `expense ${e.id}`),
  status: map(EXPENSE_STATUS, e.status, `expense ${e.id}`),
  receiptAttached: e.receiptAttached,
  notes: e.notes ?? null,
}));

// ---- Recurring bills ----
const recurringBills = mockRecurringBills.map((r) => ({
  legacyId: r.id,
  propertyLegacyId: r.propertyId,
  name: r.name,
  category: map(RECURRING_BILL_CATEGORY, r.category, `recurring bill ${r.id}`),
  vendor: r.vendor,
  amount: r.amount,
  frequency: map(BILL_FREQUENCY, r.frequency, `recurring bill ${r.id}`),
  nextDueDate: r.nextDueDate,
  status: map(RECURRING_BILL_STATUS, r.status, `recurring bill ${r.id}`),
  autoRenew: r.autoRenew,
  reminderDays: r.reminderDays,
}));
if (mockRecurringBills.some((r) => r.payments && r.payments.length > 0)) {
  throw new Error('Expected zero bill payments — plan section 8 assumption violated, re-check.');
}

// ---- Technicians ----
// Extends issue #2's "always trust the room" rule to tech work orders too (not explicitly
// enumerated in the plan's issue list, but the same class of bug: wo-t01-02 claims
// propertyId=prop-02/roomNumber=B-301 against roomId=room-06, which is really prop-01/B-105).
const technicians = mockTechnicians.map((t) => ({
  legacyId: t.id,
  name: t.name,
  company: t.company,
  contact: t.contact,
  email: t.email,
  avatarUrl: t.avatar,
  specialization: map(TECHNICIAN_SPECIALIZATION, t.specialization, `technician ${t.id}`),
  rating: t.rating,
  availability: map(TECHNICIAN_AVAILABILITY, t.availability, `technician ${t.id}`),
  hourlyRate: t.hourlyRate ?? null,
  notes: t.notes ?? null,
  address: t.address ?? null,
  nationalId: t.nationalId ?? null,
  emergencyContact: t.emergencyContact ?? null,
  preferredPaymentMethod: t.preferredPaymentMethod ? map(TECH_PAYOUT_METHOD, t.preferredPaymentMethod, `technician ${t.id}`) : null,
  payoutAccount: t.payoutAccount ?? null,
  yearsExperience: t.yearsExperience ?? null,
  certifications: t.certifications ?? [],
  workOrders: (t.workOrders ?? []).map((w) => ({
    jobNumber: w.jobNumber,
    propertyLegacyId: w.roomId ? realPropertyIdForRoom(w.roomId, `work order ${w.id}`) : w.propertyId,
    roomLegacyId: w.roomId ?? null,
    title: w.title,
    description: w.description,
    category: map(WORK_ORDER_CATEGORY, w.category, `work order ${w.id}`),
    priority: map(WORK_ORDER_PRIORITY, w.priority, `work order ${w.id}`),
    dispatchedDate: w.dispatchedDate,
    startDate: w.startDate ?? null,
    completedDate: w.completedDate ?? null,
    estimatedHours: w.estimatedHours,
    actualHours: w.actualHours ?? null,
    laborCost: w.laborCost,
    materialCost: w.materialCost,
    paymentStatus: map(WORK_ORDER_PAYMENT_STATUS, w.paymentStatus, `work order ${w.id}`),
    paidAmount: w.paidAmount,
    status: map(WORK_ORDER_STATUS, w.status, `work order ${w.id}`),
    rating: w.rating ?? null,
    ratingComment: w.ratingComment ?? null,
    notes: w.notes ?? null,
    photos: w.photos ?? [],
  })),
  documents: (t.documents ?? []).map((d) => ({
    name: d.name,
    type: map(TECH_DOCUMENT_TYPE, d.type, `tech document ${d.id}`),
    fileUrl: d.fileUrl,
    uploadDate: d.uploadDate,
    expiryDate: d.expiryDate ?? null,
    status: map(TECH_DOCUMENT_STATUS, d.status, `tech document ${d.id}`),
  })),
}));

// ---- Preventive tasks ----
function resolveInformalPropertyName(name: string | undefined): string | null {
  if (!name) return null;
  if (name.includes('Nyarutarama')) return 'prop-02';
  if (name.includes('Kigali Heights') || name.includes('Gacuriro')) return 'prop-01';
  return null;
}

const preventiveTasks = mockPreventiveTasks.map((p) => ({
  legacyId: p.id,
  propertyLegacyId: p.propertyId,
  category: map(PREVENTIVE_CATEGORY, p.category, `preventive task ${p.id}`),
  taskName: p.taskName,
  frequency: map(PREVENTIVE_FREQUENCY, p.frequency, `preventive task ${p.id}`),
  scheduleWeek: p.scheduleWeek,
  assignedStaffLegacyId: p.assignedStaffId,
  status: map(INSPECTION_STATUS, p.status, `preventive task ${p.id}`),
  remarks: p.remarks,
  dueDate: p.dueDate,
  lastCompletedDate: p.lastCompletedDate ?? null,
  resolvedDate: p.resolvedDate ?? null,
  evidencePhotos: p.evidencePhotos ?? [],
}));

// ---- Damage reports ----
const damageReports = mockDamages.map((d) => ({
  legacyId: d.id,
  propertyLegacyId: realPropertyIdForRoom(d.roomId, `damage report ${d.id}`),
  roomLegacyId: d.roomId,
  clientLegacyId: d.clientId ?? null,
  item: d.item,
  damageType: d.damageType,
  description: d.description,
  reportedDate: d.reportedDate,
  estimatedCost: d.estimatedCost,
  amountCharged: d.amountCharged,
  responsibleParty: map(RESPONSIBLE_PARTY, d.responsibleParty, `damage report ${d.id}`),
  status: map(DAMAGE_STATUS, d.status, `damage report ${d.id}`),
  resolutionNotes: d.resolutionNotes ?? null,
  photos: d.photos ?? [],
}));

// ---- Water meters ----
const waterMeters = mockWaterMeters.map((w) => ({
  legacyId: w.id,
  propertyLegacyId: realPropertyIdForRoom(w.roomId, `water meter ${w.id}`),
  roomLegacyId: w.roomId,
  clientLegacyId: w.clientId,
  meterNumber: w.meterNumber,
  previousReading: w.previousReading,
  currentReading: w.currentReading,
  consumptionM3: w.consumptionM3,
  readingDate: w.readingDate,
  ratePerM3: w.ratePerM3,
  totalAmount: w.totalAmount,
  paymentStatus: map(WATER_PAYMENT_STATUS, w.paymentStatus, `water meter ${w.id}`),
  history: w.history.map((h) => ({
    periodMonth: h.month,
    reading: h.reading,
    consumption: h.consumption,
    amount: h.amount,
  })),
}));

// ---- Employees ----
const employees = mockEmployees.map((e) => ({
  legacyId: e.id,
  name: e.name,
  avatarUrl: e.avatar,
  position: e.position,
  department: map(DEPARTMENT, e.department, `employee ${e.id}`),
  contact: e.contact,
  email: e.email,
  employmentStatus: map(EMPLOYMENT_STATUS, e.employmentStatus, `employee ${e.id}`),
  status: map(EMPLOYEE_STATUS, e.status, `employee ${e.id}`),
  statusReason: e.statusReason ?? null,
  startDate: e.startDate,
  basicSalary: e.basicSalary,
  nationalId: e.nationalId,
  emergencyContact: e.emergencyContact ?? null,
  address: e.address ?? null,
  documents: (e.documents ?? []).map((d) => ({
    name: d.name,
    type: map(EMPLOYEE_DOCUMENT_TYPE, d.type, `employee document ${d.id}`),
    fileUrl: d.fileUrl,
    uploadDate: d.uploadDate,
    sizeLabel: d.size ?? null,
    status: map(EMPLOYEE_DOCUMENT_STATUS, d.status, `employee document ${d.id}`),
  })),
  dailyTasks: (e.dailyTasks ?? []).map((t) => ({
    title: t.title,
    description: t.description,
    assignedDate: t.assignedDate,
    dueDate: t.dueDate,
    priority: map(TASK_PRIORITY, t.priority, `daily task ${t.id}`),
    propertyLegacyId: resolveInformalPropertyName(t.propertyName),
    roomNumber: t.roomNumber ?? null,
    status: map(DAILY_TASK_STATUS, t.status, `daily task ${t.id}`),
    completedDate: t.completedDate ?? null,
    managerComment: t.managerComment ?? null,
    rating: t.rating ?? null,
    ratedByName: t.ratedBy ?? null,
  })),
  damages: (e.damages ?? []).map((d) => ({
    incidentDate: d.incidentDate,
    item: d.item,
    propertyName: d.propertyName ?? null,
    roomNumber: d.roomNumber ?? null,
    description: d.description,
    estimatedCost: d.estimatedCost,
    deductedFromSalary: d.deductedFromSalary,
    deductedAmount: d.deductedAmount,
    status: map(EMPLOYEE_DAMAGE_STATUS, d.status, `employee damage ${d.id}`),
    photos: d.photos ?? [],
  })),
}));
if (mockEmployees.some((e) => e.leaves && e.leaves.length > 0)) {
  throw new Error('Expected zero employee leaves — plan section 8 assumption violated, re-check.');
}

// ---- Payroll records ----
const payrollRecords = mockPayrollRecords.map((p) => ({
  legacyId: p.id,
  payrollNumber: p.payrollNumber,
  employeeLegacyId: p.employeeId,
  employeeName: p.employeeName,
  position: p.position,
  department: p.department,
  period: p.period,
  basicSalary: p.basicSalary,
  allowances: p.allowances,
  bonuses: p.bonuses,
  deductions: p.deductions,
  taxAmount: p.taxAmount,
  netSalary: p.netSalary,
  paymentDate: p.paymentDate,
  paymentStatus: map(PAYROLL_PAYMENT_STATUS, p.paymentStatus, `payroll ${p.id}`),
  paymentMethod: map(PAYMENT_METHOD, p.paymentMethod, `payroll ${p.id}`),
}));

// ---- Maintenance issues ----
const maintenanceIssues = mockMaintenanceIssues.map((m) => ({
  legacyId: m.id,
  ticketNumber: m.ticketNumber,
  clientLegacyId: m.clientId,
  propertyLegacyId: realPropertyIdForRoom(m.roomId, `maintenance issue ${m.id}`),
  roomLegacyId: m.roomId,
  category: map(ISSUE_CATEGORY, m.category, `maintenance issue ${m.id}`),
  title: m.title,
  description: m.description,
  priority: map(ISSUE_PRIORITY, m.priority, `maintenance issue ${m.id}`),
  status: map(ISSUE_STATUS, m.status, `maintenance issue ${m.id}`),
  reportedDate: toDateTimeIso(m.reportedDate),
  assignedTechnicianLegacyId: m.assignedTechnicianId ?? null,
  resolutionDate: m.resolutionDate ? datePartOf(m.resolutionDate) : null,
  resolutionNotes: m.resolutionNotes ?? null,
  photos: m.photos ?? [],
}));

// ---- Activity logs ----
const activityLogs = mockActivityLogs.map((a) => ({
  legacyId: a.id,
  occurredAt: toDateTimeIso(a.timestamp),
  userLegacyId: a.userId,
  userName: a.userName,
  role: a.role,
  action: a.action,
  module: a.module,
  details: a.details,
  type: map(ACTIVITY_TYPE, a.type, `activity log ${a.id}`),
}));

// ---- Notifications ----
function parseRelativeTime(text: string): number {
  const match = text.match(/^(\d+)\s+(hour|day|week)s?\s+ago$/);
  if (!match) throw new Error(`Unrecognized relative time format: "${text}"`);
  const amount = Number(match[1]);
  const unitMs = { hour: 3_600_000, day: 86_400_000, week: 604_800_000 }[match[2] as 'hour' | 'day' | 'week'];
  return amount * unitMs;
}

const notifications = mockNotifications.map((n) => ({
  legacyId: n.id,
  title: n.title,
  message: n.message,
  occurredAt: new Date(REFERENCE_INSTANT.getTime() - parseRelativeTime(n.time)).toISOString(),
  read: n.read,
  type: map(NOTIFICATION_TYPE, n.type, `notification ${n.id}`),
  targetRoles: n.targetRoles.map((r) => map(USER_ROLE, r, `notification ${n.id} targetRoles`)),
  link: n.link ?? null,
}));

const output = {
  users,
  properties,
  buildings,
  rentalTypes,
  rooms,
  clients,
  bookings,
  agents,
  payments,
  expenses,
  recurringBills,
  technicians,
  preventiveTasks,
  damageReports,
  waterMeters,
  employees,
  payrollRecords,
  maintenanceIssues,
  activityLogs,
  notifications,
};

mkdirSync(dirname(OUT_PATH), { recursive: true });
writeFileSync(OUT_PATH, JSON.stringify(output, null, 2));

const counts = {
  users: users.length,
  properties: properties.length,
  buildings: buildings.length,
  rentalTypes: rentalTypes.length,
  rentalTypeIncludedMaterials: rentalTypes.reduce((s, r) => s + r.includedMaterials.length, 0),
  rooms: rooms.length,
  clients: clients.length,
  clientMaterials: clients.reduce((s, c) => s + c.materials.length, 0),
  bookings: bookings.length,
  bookingTimelineEvents: bookings.reduce((s, b) => s + b.timeline.length, 0),
  payments: payments.length,
  expenses: expenses.length,
  recurringBills: recurringBills.length,
  technicians: technicians.length,
  techWorkOrders: technicians.reduce((s, t) => s + t.workOrders.length, 0),
  preventiveTasks: preventiveTasks.length,
  damageReports: damageReports.length,
  waterMeters: waterMeters.length,
  waterMeterHistory: waterMeters.reduce((s, w) => s + w.history.length, 0),
  employees: employees.length,
  employeeDailyTasks: employees.reduce((s, e) => s + e.dailyTasks.length, 0),
  employeeDamages: employees.reduce((s, e) => s + e.damages.length, 0),
  employeeDocuments: employees.reduce((s, e) => s + e.documents.length, 0),
  payrollRecords: payrollRecords.length,
  agents: agents.length,
  agentDeals: agents.reduce((s, a) => s + a.deals.length, 0),
  maintenanceIssues: maintenanceIssues.length,
  activityLogs: activityLogs.length,
  notifications: notifications.length,
};

console.log('Extraction complete ->', OUT_PATH);
console.log(JSON.stringify(counts, null, 2));
