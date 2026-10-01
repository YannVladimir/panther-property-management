export type UserRole = 'public' | 'client' | 'operations' | 'owner' | 'household' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar: string;
  title?: string;
  clientId?: string;
  employeeId?: string;
}

export type PropertyStatus = 'active' | 'maintenance' | 'full';

export interface Property {
  id: string;
  name: string;
  code: string;
  location: string;
  neighborhood: string;
  city: string;
  address: string;
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  reservedRooms: number;
  maintenanceRooms: number;
  images: string[];
  amenities: string[];
  description: string;
  rating: number;
  reviewCount: number;
  featured: boolean;
  yearBuilt: number;
  monthlyRevenueEstimate: number;
}

export interface Building {
  id: string;
  propertyId: string;
  propertyName: string;
  name: string;
  floorsCount: number;
  totalRooms: number;
}

export type RoomStatus = 'available' | 'reserved' | 'occupied' | 'maintenance';
export type FurnishingType = 'Fully Furnished' | 'Self Furnished' | 'Semi-Furnished' | 'Executive Luxury';

export interface Room {
  id: string;
  propertyId: string;
  propertyName: string;
  buildingId: string;
  buildingName: string;
  roomNumber: string;
  floor: number;
  sizeSqM: number;
  bedrooms: number;
  bathrooms: number;
  furnishingType: FurnishingType;
  monthlyRent: number;
  deposit: number;
  status: RoomStatus;
  amenities: string[];
  utilitiesIncluded: string[];
  rules: string[];
  images: string[];
  currentClientId?: string;
  currentClientName?: string;
  virtualTourUrl?: string;
  description: string;
}

export interface IncludedMaterialItem {
  id: string;
  name: string;
  quantity: number;
  condition: string;
  category: string;
}

export interface RentalTypeConfig {
  id: string;
  name: FurnishingType;
  description: string;
  priceMultiplier: number;
  includedMaterials: IncludedMaterialItem[];
  status: 'active' | 'inactive';
  applicablePropertyIds: string[];
}

export type BookingStatus =
  | 'requested'
  | 'under_review'
  | 'approved'
  | 'room_assigned'
  | 'confirmed'
  | 'checked_in'
  | 'cancelled'
  | 'rejected'
  | 'completed';

export interface Booking {
  id: string;
  bookingNumber: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  propertyId: string;
  propertyName: string;
  roomId?: string;
  roomNumber?: string;
  rentalTypeId: string;
  rentalTypeName: string;
  requestedDate: string;
  moveInDate: string;
  moveOutDate?: string;
  monthlyRent: number;
  deposit: number;
  status: BookingStatus;
  notes?: string;
  source?: 'client_portal' | 'operations_manager' | 'walk_in' | 'phone_inquiry' | 'agent_referral';
  agentId?: string;
  agentName?: string;
  timeline: {
    status: BookingStatus;
    timestamp: string;
    note?: string;
    updatedBy: string;
  }[];
}

export interface ClientMaterial {
  id: string;
  itemId: string;
  name: string;
  quantity: number;
  condition: 'Excellent' | 'Good' | 'Fair' | 'Needs Repair';
  assignedDate: string;
  serialNumber: string;
  category: string;
}

export interface ClientDocument {
  id: string;
  name: string;
  type: 'Tenancy Contract' | 'National ID' | 'Passport' | 'Proof of Income' | 'Work Permit' | 'Move-In Inventory' | 'Deposit Guarantee' | 'Other';
  fileUrl: string;
  uploadDate: string;
  size?: string;
  status: 'Verified' | 'Pending Review' | 'Expired';
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  identificationNumber: string;
  nationality: string;
  occupation?: string;
  employer?: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  currentRoomId: string;
  currentRoomNumber: string;
  currentPropertyId: string;
  currentPropertyName: string;
  rentalType: FurnishingType;
  moveInDate: string;
  leaseExpiryDate: string;
  monthlyRent: number;
  depositPaid: number;
  paymentStatus: 'paid' | 'pending' | 'overdue';
  materials: ClientMaterial[];
  documents?: ClientDocument[];
  status: 'active' | 'former' | 'inactive' | 'suspended';
  deactivationReason?: string;
  deactivatedDate?: string;
  notes?: string;
}

export type PaymentType = 'rent' | 'deposit' | 'utility' | 'penalty' | 'maintenance' | 'other';
export type PaymentMethod = 'Mobile Money' | 'Bank Transfer' | 'Credit Card' | 'Cash';
export type PaymentStatus = 'paid' | 'pending' | 'overdue' | 'cancelled';

export interface Payment {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  clientAvatar?: string;
  propertyId: string;
  propertyName: string;
  roomId: string;
  roomNumber: string;
  amount: number;
  date: string;
  dueDate: string;
  type: PaymentType;
  method: PaymentMethod;
  reference: string;
  status: PaymentStatus;
  receiptUrl?: string;
  notes?: string;
}

export type ExpenseCategory =
  | 'Maintenance'
  | 'Cleaning'
  | 'Security'
  | 'Utilities'
  | 'Repairs'
  | 'Supplies'
  | 'Staff'
  | 'Landscaping'
  | 'Other';

export interface Expense {
  id: string;
  propertyId: string;
  propertyName: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string;
  vendor: string;
  paymentMethod: PaymentMethod;
  status: 'paid' | 'pending';
  receiptAttached: boolean;
  notes?: string;
}

export interface BillPayment {
  id: string;
  paidDate: string;
  amount: number;
  method: 'Mobile Money' | 'Bank Transfer' | 'Cash' | 'Cheque';
  reference: string;
  notes?: string;
  proofUrl?: string; // filename of uploaded proof
}

export interface RecurringBill {
  id: string;
  propertyId: string;
  propertyName: string;
  name: string;
  category: 'Electricity' | 'Water' | 'Internet' | 'Security' | 'Cleaning' | 'Maintenance Contract' | 'Garbage Collection';
  vendor: string;
  amount: number;
  frequency: 'Monthly' | 'Quarterly' | 'Bi-Weekly' | 'Annual';
  nextDueDate: string;
  status: 'paid' | 'upcoming' | 'overdue';
  autoRenew: boolean;
  reminderDays: number;
  payments?: BillPayment[];
}

export type TechWorkOrderStatus = 'Dispatched' | 'In Progress' | 'Completed' | 'Cancelled' | 'On Hold';

export interface TechWorkOrder {
  id: string;
  jobNumber: string;
  propertyId: string;
  propertyName: string;
  roomId?: string;
  roomNumber?: string;
  title: string;
  description: string;
  category: 'Plumbing' | 'Electrical' | 'Carpentry' | 'HVAC' | 'Painting' | 'IT & Security' | 'General';
  priority: 'Low' | 'Medium' | 'High' | 'Emergency';
  dispatchedDate: string;
  startDate?: string;
  completedDate?: string;
  estimatedHours: number;
  actualHours?: number;
  laborCost: number;
  materialCost: number;
  totalCost: number;
  paymentStatus: 'Unpaid' | 'Partially Paid' | 'Paid';
  paidAmount: number;
  status: TechWorkOrderStatus;
  rating?: number; // 1–5
  ratingComment?: string;
  photos?: string[];
  notes?: string;
}

export interface TechDocument {
  id: string;
  name: string;
  type: 'License' | 'Certification' | 'Contract' | 'Insurance' | 'ID' | 'Invoice' | 'Other';
  fileUrl: string;
  uploadDate: string;
  expiryDate?: string;
  status: 'Valid' | 'Expired' | 'Pending Review';
}

export interface Technician {
  id: string;
  name: string;
  company: string;
  contact: string;
  email: string;
  avatar: string;
  specialization: 'Plumber' | 'Electrician' | 'Carpenter' | 'HVAC' | 'Painter' | 'IT & Security' | 'General Maintenance';
  rating: number;
  availability: 'Available' | 'On Job' | 'Unavailable';
  totalJobs: number;
  totalPaid: number;
  hourlyRate?: number;
  notes?: string;
  // Extended fields
  address?: string;
  nationalId?: string;
  emergencyContact?: { name: string; phone: string; relationship: string };
  preferredPaymentMethod?: 'Mobile Money' | 'Bank Transfer' | 'Cash';
  payoutAccount?: string;
  certifications?: string[];
  yearsExperience?: number;
  workOrders?: TechWorkOrder[];
  documents?: TechDocument[];
}

export type PreventiveCategory =
  | 'Common Areas'
  | 'Corridors'
  | 'Staircases'
  | 'Compound & Parking'
  | 'Lighting Systems'
  | 'Tiles & Floors'
  | 'Walls & Painting'
  | 'Windows & Doors'
  | 'Handrails & Balconies'
  | 'Walkways'
  | 'Waste Management'
  | 'Electrical System'
  | 'Roof & Drainage'
  | 'Pest Control'
  | 'Garden & Landscaping';

export type InspectionStatus = 'pass' | 'failed' | 'needs_attention' | 'not_applicable' | 'pending';

export interface PreventiveTask {
  id: string;
  propertyId: string;
  propertyName: string;
  category: PreventiveCategory;
  taskName: string;
  frequency: 'Weekly' | 'Bi-Weekly' | 'Monthly' | 'Quarterly' | 'Custom';
  scheduleWeek: number; // 1 to 4
  assignedStaffId: string;
  assignedStaffName: string;
  status: InspectionStatus;
  remarks: string;
  evidencePhotos: string[];
  lastCompletedDate?: string;
  dueDate: string;
  resolvedDate?: string;
}

export interface DamageReport {
  id: string;
  propertyId: string;
  propertyName: string;
  roomId: string;
  roomNumber: string;
  clientId?: string;
  clientName?: string;
  item: string;
  damageType: string;
  description: string;
  reportedDate: string;
  photos: string[];
  estimatedCost: number;
  amountCharged: number;
  responsibleParty: 'Tenant' | 'Property Owner' | 'Wear & Tear' | 'Contractor';
  status: 'Pending Review' | 'In Repair' | 'Resolved' | 'Disputed';
  resolutionNotes?: string;
}

export interface WaterMeterRecord {
  id: string;
  propertyId: string;
  propertyName: string;
  roomId: string;
  roomNumber: string;
  clientId: string;
  clientName: string;
  meterNumber: string;
  previousReading: number;
  currentReading: number;
  consumptionM3: number;
  readingDate: string;
  ratePerM3: number;
  totalAmount: number;
  paymentStatus: 'paid' | 'pending' | 'overdue';
  history: {
    month: string;
    reading: number;
    consumption: number;
    amount: number;
  }[];
}

export interface EmployeeDocument {
  id: string;
  name: string;
  type: 'Employment Contract' | 'National ID / Passport' | 'Criminal Record Clearance' | 'Health Insurance' | 'Certificate / Degree' | 'Other';
  fileUrl: string;
  uploadDate: string;
  size?: string;
  status: 'Verified' | 'Pending Review' | 'Expired';
}

export interface EmployeeDailyTask {
  id: string;
  title: string;
  description: string;
  assignedDate: string;
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low';
  propertyId?: string;
  propertyName?: string;
  roomNumber?: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Rejected';
  completedDate?: string;
  managerComment?: string;
  rating?: number; // 1 to 5 stars
  ratedBy?: string;
}

export interface EmployeeDamage {
  id: string;
  incidentDate: string;
  item: string;
  propertyName: string;
  roomNumber?: string;
  description: string;
  estimatedCost: number;
  deductedFromSalary: boolean;
  deductedAmount: number;
  status: 'Investigating' | 'Deducted' | 'Forgiven' | 'Settled';
  photos: string[];
}

export interface EmployeeLeave {
  id: string;
  leaveType: 'Annual Leave' | 'Sick Leave' | 'Maternity / Paternity' | 'Compassionate Leave' | 'Unpaid Leave';
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  status: 'Approved' | 'Pending' | 'Completed' | 'Cancelled';
  approvedBy?: string;
  requestedDate: string;
}

export interface Employee {
  id: string;
  name: string;
  avatar: string;
  position: string;
  department: 'Operations' | 'Maintenance' | 'Housekeeping' | 'Security' | 'Finance' | 'Management';
  contact: string;
  email: string;
  employmentStatus: 'Full-Time' | 'Part-Time' | 'Contract';
  status: 'active' | 'on_leave' | 'suspended' | 'terminated';
  statusReason?: string;
  startDate: string;
  basicSalary: number;
  nationalId: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  address?: string;
  documents?: EmployeeDocument[];
  dailyTasks?: EmployeeDailyTask[];
  damages?: EmployeeDamage[];
  leaves?: EmployeeLeave[];
}

export interface PayrollRecord {
  id: string;
  payrollNumber: string;
  employeeId: string;
  employeeName: string;
  position: string;
  department: string;
  period: string; // e.g. "August 2026"
  basicSalary: number;
  allowances: number;
  bonuses: number;
  deductions: number;
  taxAmount: number;
  netSalary: number;
  paymentDate: string;
  paymentStatus: 'Paid' | 'Processing' | 'Pending';
  paymentMethod: PaymentMethod;
}

export interface AgentDeal {
  id: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  propertyId: string;
  propertyName: string;
  roomId?: string;
  roomNumber?: string;
  rentalType?: string;
  monthlyRent: number;
  commissionPercentage: number;
  commissionAmount: number;
  date: string;
  status: 'Paid' | 'Pending' | 'Processing';
  payoutDate?: string;
  payoutReference?: string;
  notes?: string;
}

export interface Agent {
  id: string;
  name: string;
  agency?: string;
  phone: string;
  email: string;
  avatar: string;
  status: 'Active' | 'Inactive';
  clientsReferred: number;
  bookingsCount: number;
  successfulRentals: number;
  commissionRatePercent: number;
  totalCommissionEarned: number;
  commissionPaid: number;
  outstandingCommission: number;
  paymentMethod?: 'Mobile Money' | 'Bank Transfer' | 'Cash';
  payoutAccount?: string;
  notes?: string;
  deals: AgentDeal[];
  recentDeals?: {
    clientName: string;
    propertyName: string;
    date: string;
    commissionAmount: number;
  }[];
}

export type IssuePriority = 'Low' | 'Medium' | 'High' | 'Emergency';
export type IssueStatus = 'Submitted' | 'Reviewed' | 'Assigned' | 'In Progress' | 'Resolved' | 'Closed';

export interface MaintenanceIssue {
  id: string;
  ticketNumber: string;
  clientId: string;
  clientName: string;
  clientAvatar?: string;
  propertyId: string;
  propertyName: string;
  roomId: string;
  roomNumber: string;
  category: 'Plumbing' | 'Electrical' | 'Furniture' | 'Appliances' | 'HVAC' | 'Structural' | 'Other';
  title: string;
  description: string;
  priority: IssuePriority;
  photos: string[];
  status: IssueStatus;
  reportedDate: string;
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  technicianSpecialty?: string;
  resolutionDate?: string;
  resolutionNotes?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  role: string;
  action: string;
  module: string;
  details: string;
  type: 'info' | 'success' | 'warning' | 'critical';
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'booking' | 'payment' | 'maintenance' | 'system' | 'payroll' | 'alert';
  targetRoles: UserRole[];
  link?: string;
}
