import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { PageResponse } from './pagination';
import { Technician, TechWorkOrder, TechDocument } from '../types';

interface EmergencyContactDto {
  name: string;
  phone: string;
  relationship?: string;
}

interface TechWorkOrderDto {
  id: number;
  jobNumber: string;
  propertyId: number;
  propertyName: string;
  roomId?: number;
  roomNumber?: string;
  title: string;
  description?: string;
  category: string;
  priority: string;
  dispatchedDate: string;
  startDate?: string;
  completedDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  laborCost: number;
  materialCost: number;
  totalCost: number;
  paymentStatus: string;
  paidAmount: number;
  status: string;
  rating?: number;
  ratingComment?: string;
  photos: string[];
  notes?: string;
}

interface TechDocumentDto {
  id: number;
  name: string;
  type: string;
  fileUrl: string;
  uploadDate?: string;
  expiryDate?: string;
  status: string;
}

interface TechnicianResponseDto {
  id: number;
  name: string;
  company?: string;
  contact: string;
  email?: string;
  avatarUrl?: string;
  specialization: string;
  rating: number;
  availability: string;
  totalJobs: number;
  totalPaid: number;
  hourlyRate?: number;
  notes?: string;
  address?: string;
  nationalId?: string;
  emergencyContact?: EmergencyContactDto;
  preferredPaymentMethod?: string;
  payoutAccount?: string;
  certifications: string[];
  yearsExperience?: number;
  workOrders: TechWorkOrderDto[];
  documents: TechDocumentDto[];
}

const SPECIALIZATION_TO_FRONTEND: Record<string, Technician['specialization']> = {
  PLUMBER: 'Plumber',
  ELECTRICIAN: 'Electrician',
  CARPENTER: 'Carpenter',
  HVAC: 'HVAC',
  PAINTER: 'Painter',
  IT_SECURITY: 'IT & Security',
  GENERAL_MAINTENANCE: 'General Maintenance',
};
const SPECIALIZATION_TO_BACKEND: Record<Technician['specialization'], string> = {
  Plumber: 'PLUMBER',
  Electrician: 'ELECTRICIAN',
  Carpenter: 'CARPENTER',
  HVAC: 'HVAC',
  Painter: 'PAINTER',
  'IT & Security': 'IT_SECURITY',
  'General Maintenance': 'GENERAL_MAINTENANCE',
};

const AVAILABILITY_TO_FRONTEND: Record<string, Technician['availability']> = {
  AVAILABLE: 'Available',
  ON_JOB: 'On Job',
  UNAVAILABLE: 'Unavailable',
};
const AVAILABILITY_TO_BACKEND: Record<Technician['availability'], string> = {
  Available: 'AVAILABLE',
  'On Job': 'ON_JOB',
  Unavailable: 'UNAVAILABLE',
};

const PAYOUT_METHOD_TO_FRONTEND: Record<string, NonNullable<Technician['preferredPaymentMethod']>> = {
  MOBILE_MONEY: 'Mobile Money',
  BANK_TRANSFER: 'Bank Transfer',
  CASH: 'Cash',
};
const PAYOUT_METHOD_TO_BACKEND: Record<NonNullable<Technician['preferredPaymentMethod']>, string> = {
  'Mobile Money': 'MOBILE_MONEY',
  'Bank Transfer': 'BANK_TRANSFER',
  Cash: 'CASH',
};

const WO_CATEGORY_TO_FRONTEND: Record<string, TechWorkOrder['category']> = {
  PLUMBING: 'Plumbing',
  ELECTRICAL: 'Electrical',
  CARPENTRY: 'Carpentry',
  HVAC: 'HVAC',
  PAINTING: 'Painting',
  IT_SECURITY: 'IT & Security',
  GENERAL: 'General',
};
const WO_CATEGORY_TO_BACKEND: Record<TechWorkOrder['category'], string> = {
  Plumbing: 'PLUMBING',
  Electrical: 'ELECTRICAL',
  Carpentry: 'CARPENTRY',
  HVAC: 'HVAC',
  Painting: 'PAINTING',
  'IT & Security': 'IT_SECURITY',
  General: 'GENERAL',
};

const WO_PRIORITY_TO_FRONTEND: Record<string, TechWorkOrder['priority']> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  EMERGENCY: 'Emergency',
};
const WO_PRIORITY_TO_BACKEND: Record<TechWorkOrder['priority'], string> = {
  Low: 'LOW',
  Medium: 'MEDIUM',
  High: 'HIGH',
  Emergency: 'EMERGENCY',
};

const WO_STATUS_TO_FRONTEND: Record<string, TechWorkOrder['status']> = {
  DISPATCHED: 'Dispatched',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  ON_HOLD: 'On Hold',
};
const WO_STATUS_TO_BACKEND: Record<TechWorkOrder['status'], string> = {
  Dispatched: 'DISPATCHED',
  'In Progress': 'IN_PROGRESS',
  Completed: 'COMPLETED',
  Cancelled: 'CANCELLED',
  'On Hold': 'ON_HOLD',
};

const WO_PAYMENT_STATUS_TO_FRONTEND: Record<string, TechWorkOrder['paymentStatus']> = {
  UNPAID: 'Unpaid',
  PARTIALLY_PAID: 'Partially Paid',
  PAID: 'Paid',
};
const WO_PAYMENT_STATUS_TO_BACKEND: Record<TechWorkOrder['paymentStatus'], string> = {
  Unpaid: 'UNPAID',
  'Partially Paid': 'PARTIALLY_PAID',
  Paid: 'PAID',
};

const DOC_TYPE_TO_FRONTEND: Record<string, TechDocument['type']> = {
  LICENSE: 'License',
  CERTIFICATION: 'Certification',
  CONTRACT: 'Contract',
  INSURANCE: 'Insurance',
  ID: 'ID',
  INVOICE: 'Invoice',
  OTHER: 'Other',
};
const DOC_TYPE_TO_BACKEND: Record<TechDocument['type'], string> = {
  License: 'LICENSE',
  Certification: 'CERTIFICATION',
  Contract: 'CONTRACT',
  Insurance: 'INSURANCE',
  ID: 'ID',
  Invoice: 'INVOICE',
  Other: 'OTHER',
};

const DOC_STATUS_TO_FRONTEND: Record<string, TechDocument['status']> = {
  VALID: 'Valid',
  EXPIRED: 'Expired',
  PENDING_REVIEW: 'Pending Review',
};
const DOC_STATUS_TO_BACKEND: Record<TechDocument['status'], string> = {
  Valid: 'VALID',
  Expired: 'EXPIRED',
  'Pending Review': 'PENDING_REVIEW',
};

function toFrontendWorkOrder(dto: TechWorkOrderDto): TechWorkOrder {
  return {
    id: String(dto.id),
    jobNumber: dto.jobNumber,
    propertyId: String(dto.propertyId),
    propertyName: dto.propertyName,
    roomId: dto.roomId !== undefined ? String(dto.roomId) : undefined,
    roomNumber: dto.roomNumber,
    title: dto.title,
    description: dto.description ?? '',
    category: WO_CATEGORY_TO_FRONTEND[dto.category] ?? 'General',
    priority: WO_PRIORITY_TO_FRONTEND[dto.priority] ?? 'Medium',
    dispatchedDate: dto.dispatchedDate,
    startDate: dto.startDate,
    completedDate: dto.completedDate,
    estimatedHours: dto.estimatedHours ?? 0,
    actualHours: dto.actualHours,
    laborCost: dto.laborCost,
    materialCost: dto.materialCost,
    totalCost: dto.totalCost,
    paymentStatus: WO_PAYMENT_STATUS_TO_FRONTEND[dto.paymentStatus] ?? 'Unpaid',
    paidAmount: dto.paidAmount,
    status: WO_STATUS_TO_FRONTEND[dto.status] ?? 'Dispatched',
    rating: dto.rating,
    ratingComment: dto.ratingComment,
    photos: dto.photos,
    notes: dto.notes,
  };
}

function toFrontendDocument(dto: TechDocumentDto): TechDocument {
  return {
    id: String(dto.id),
    name: dto.name,
    type: DOC_TYPE_TO_FRONTEND[dto.type] ?? 'Other',
    fileUrl: dto.fileUrl,
    uploadDate: dto.uploadDate ?? '',
    expiryDate: dto.expiryDate,
    status: DOC_STATUS_TO_FRONTEND[dto.status] ?? 'Pending Review',
  };
}

function toFrontend(dto: TechnicianResponseDto): Technician {
  return {
    id: String(dto.id),
    name: dto.name,
    company: dto.company ?? '',
    contact: dto.contact,
    email: dto.email ?? '',
    avatar: dto.avatarUrl ?? '',
    specialization: SPECIALIZATION_TO_FRONTEND[dto.specialization] ?? 'General Maintenance',
    rating: dto.rating,
    availability: AVAILABILITY_TO_FRONTEND[dto.availability] ?? 'Available',
    totalJobs: dto.totalJobs,
    totalPaid: dto.totalPaid,
    hourlyRate: dto.hourlyRate,
    notes: dto.notes,
    address: dto.address,
    nationalId: dto.nationalId,
    emergencyContact: dto.emergencyContact
      ? { name: dto.emergencyContact.name, phone: dto.emergencyContact.phone, relationship: dto.emergencyContact.relationship ?? '' }
      : undefined,
    preferredPaymentMethod: dto.preferredPaymentMethod ? PAYOUT_METHOD_TO_FRONTEND[dto.preferredPaymentMethod] : undefined,
    payoutAccount: dto.payoutAccount,
    certifications: dto.certifications,
    yearsExperience: dto.yearsExperience,
    workOrders: dto.workOrders.map(toFrontendWorkOrder),
    documents: dto.documents.map(toFrontendDocument),
  };
}

export interface TechnicianFilters {
  specialization?: Technician['specialization'];
  search?: string;
}

export function useTechniciansQuery(filters: TechnicianFilters = {}) {
  return useQuery({
    queryKey: ['technicians', filters],
    queryFn: async () => {
      const res = await api.get<PageResponse<TechnicianResponseDto>>('/technicians', {
        specialization: filters.specialization ? SPECIALIZATION_TO_BACKEND[filters.specialization] : undefined,
        search: filters.search || undefined,
        size: 100,
      });
      return res.content.map(toFrontend);
    },
  });
}

export function useTechnicianQuery(id: string | undefined) {
  return useQuery({
    queryKey: ['technician', id],
    queryFn: async () => toFrontend(await api.get<TechnicianResponseDto>(`/technicians/${id}`)),
    enabled: !!id,
  });
}

export interface TechnicianInput {
  name: string;
  company?: string;
  contact: string;
  email?: string;
  specialization: Technician['specialization'];
  availability?: Technician['availability'];
  rating?: number;
  hourlyRate?: number;
  notes?: string;
  address?: string;
  nationalId?: string;
  emergencyContact?: { name: string; phone: string; relationship?: string };
  preferredPaymentMethod?: Technician['preferredPaymentMethod'];
  payoutAccount?: string;
  certifications?: string[];
  yearsExperience?: number;
}

export function useCreateTechnicianMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: TechnicianInput) =>
      toFrontend(
        await api.post<TechnicianResponseDto>('/technicians', {
          name: input.name,
          company: input.company,
          contact: input.contact,
          email: input.email,
          specialization: SPECIALIZATION_TO_BACKEND[input.specialization],
          hourlyRate: input.hourlyRate,
          notes: input.notes,
          address: input.address,
          nationalId: input.nationalId,
          emergencyContact: input.emergencyContact,
          preferredPaymentMethod: input.preferredPaymentMethod ? PAYOUT_METHOD_TO_BACKEND[input.preferredPaymentMethod] : undefined,
          payoutAccount: input.payoutAccount,
          certifications: input.certifications,
          yearsExperience: input.yearsExperience,
        })
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['technicians'] }),
  });
}

export function useUpdateTechnicianMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: TechnicianInput }) =>
      toFrontend(
        await api.put<TechnicianResponseDto>(`/technicians/${id}`, {
          name: input.name,
          company: input.company,
          contact: input.contact,
          email: input.email,
          specialization: SPECIALIZATION_TO_BACKEND[input.specialization],
          availability: AVAILABILITY_TO_BACKEND[input.availability ?? 'Available'],
          rating: input.rating,
          hourlyRate: input.hourlyRate,
          notes: input.notes,
          address: input.address,
          nationalId: input.nationalId,
          emergencyContact: input.emergencyContact,
          preferredPaymentMethod: input.preferredPaymentMethod ? PAYOUT_METHOD_TO_BACKEND[input.preferredPaymentMethod] : undefined,
          payoutAccount: input.payoutAccount,
          certifications: input.certifications,
          yearsExperience: input.yearsExperience,
        })
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      queryClient.invalidateQueries({ queryKey: ['technician', variables.id] });
    },
  });
}

export interface TechWorkOrderInput {
  propertyId: string;
  roomId?: string;
  title: string;
  description?: string;
  category: TechWorkOrder['category'];
  priority?: TechWorkOrder['priority'];
  dispatchedDate: string;
  estimatedHours?: number;
  photos?: string[];
  notes?: string;
}

export function useAddWorkOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ technicianId, input }: { technicianId: string; input: TechWorkOrderInput }) =>
      toFrontendWorkOrder(
        await api.post<TechWorkOrderDto>(`/technicians/${technicianId}/work-orders`, {
          propertyId: Number(input.propertyId),
          roomId: input.roomId ? Number(input.roomId) : undefined,
          title: input.title,
          description: input.description,
          category: WO_CATEGORY_TO_BACKEND[input.category],
          priority: input.priority ? WO_PRIORITY_TO_BACKEND[input.priority] : undefined,
          dispatchedDate: input.dispatchedDate,
          estimatedHours: input.estimatedHours,
          photos: input.photos,
          notes: input.notes,
        })
      ),
    onSuccess: (_data, variables) => queryClient.invalidateQueries({ queryKey: ['technician', variables.technicianId] }),
  });
}

export interface UpdateWorkOrderInput {
  priority?: TechWorkOrder['priority'];
  startDate?: string;
  completedDate?: string;
  actualHours?: number;
  laborCost: number;
  materialCost: number;
  paymentStatus: TechWorkOrder['paymentStatus'];
  paidAmount?: number;
  status: TechWorkOrder['status'];
  rating?: number;
  ratingComment?: string;
  photos?: string[];
  notes?: string;
}

export function useUpdateWorkOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      technicianId,
      workOrderId,
      input,
    }: {
      technicianId: string;
      workOrderId: string;
      input: UpdateWorkOrderInput;
    }) =>
      toFrontendWorkOrder(
        await api.put<TechWorkOrderDto>(`/technicians/${technicianId}/work-orders/${workOrderId}`, {
          priority: input.priority ? WO_PRIORITY_TO_BACKEND[input.priority] : undefined,
          startDate: input.startDate,
          completedDate: input.completedDate,
          actualHours: input.actualHours,
          laborCost: input.laborCost,
          materialCost: input.materialCost,
          paymentStatus: WO_PAYMENT_STATUS_TO_BACKEND[input.paymentStatus],
          paidAmount: input.paidAmount,
          status: WO_STATUS_TO_BACKEND[input.status],
          rating: input.rating,
          ratingComment: input.ratingComment,
          photos: input.photos,
          notes: input.notes,
        })
      ),
    onSuccess: (_data, variables) => queryClient.invalidateQueries({ queryKey: ['technician', variables.technicianId] }),
  });
}

export interface TechDocumentInput {
  name: string;
  type: TechDocument['type'];
  fileUrl: string;
  expiryDate?: string;
  status?: TechDocument['status'];
}

export function useAddTechDocumentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ technicianId, input }: { technicianId: string; input: TechDocumentInput }) =>
      toFrontendDocument(
        await api.post<TechDocumentDto>(`/technicians/${technicianId}/documents`, {
          name: input.name,
          type: DOC_TYPE_TO_BACKEND[input.type],
          fileUrl: input.fileUrl,
          expiryDate: input.expiryDate,
          status: input.status ? DOC_STATUS_TO_BACKEND[input.status] : undefined,
        })
      ),
    onSuccess: (_data, variables) => queryClient.invalidateQueries({ queryKey: ['technician', variables.technicianId] }),
  });
}
