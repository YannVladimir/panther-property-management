import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { PageResponse } from './pagination';
import { Client, ClientDocument, ClientMaterial } from '../types';

interface EmergencyContactDto {
  name: string;
  phone: string;
  relationship?: string;
}

interface ClientMaterialDto {
  id: number;
  rentalTypeItemId?: number;
  name: string;
  quantity: number;
  condition: string;
  assignedDate?: string;
  serialNumber?: string;
  category?: string;
}

interface ClientDocumentDto {
  id: number;
  name: string;
  type: string;
  fileUrl: string;
  uploadDate?: string;
  sizeLabel?: string;
  status: string;
}

interface ClientResponseDto {
  id: number;
  userId?: number;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  identificationNumber?: string;
  nationality?: string;
  occupation?: string;
  employer?: string;
  emergencyContact?: EmergencyContactDto;
  currentRoomId?: number;
  currentRoomNumber?: string;
  currentPropertyId?: number;
  currentPropertyName?: string;
  rentalType?: string;
  moveInDate?: string;
  leaseExpiryDate?: string;
  monthlyRent?: number;
  depositPaid?: number;
  paymentStatus: string;
  status: string;
  deactivationReason?: string;
  deactivatedDate?: string;
  notes?: string;
  materials: ClientMaterialDto[];
  documents: ClientDocumentDto[];
}

function toFrontendMaterial(dto: ClientMaterialDto): ClientMaterial {
  return {
    id: String(dto.id),
    itemId: dto.rentalTypeItemId !== undefined ? String(dto.rentalTypeItemId) : '',
    name: dto.name,
    quantity: dto.quantity,
    condition: conditionToFrontend(dto.condition),
    assignedDate: dto.assignedDate ?? '',
    serialNumber: dto.serialNumber ?? '',
    category: dto.category ?? '',
  };
}

function toFrontendDocument(dto: ClientDocumentDto): ClientDocument {
  return {
    id: String(dto.id),
    name: dto.name,
    type: documentTypeToFrontend(dto.type),
    fileUrl: dto.fileUrl,
    uploadDate: dto.uploadDate ?? '',
    size: dto.sizeLabel,
    status: documentStatusToFrontend(dto.status),
  };
}

function toFrontend(dto: ClientResponseDto): Client {
  return {
    id: String(dto.id),
    name: dto.name,
    email: dto.email,
    phone: dto.phone,
    avatar: dto.avatarUrl ?? '',
    identificationNumber: dto.identificationNumber ?? '',
    nationality: dto.nationality ?? '',
    occupation: dto.occupation,
    employer: dto.employer,
    emergencyContact: {
      name: dto.emergencyContact?.name ?? '',
      phone: dto.emergencyContact?.phone ?? '',
      relationship: dto.emergencyContact?.relationship ?? '',
    },
    currentRoomId: dto.currentRoomId !== undefined ? String(dto.currentRoomId) : '',
    currentRoomNumber: dto.currentRoomNumber ?? '',
    currentPropertyId: dto.currentPropertyId !== undefined ? String(dto.currentPropertyId) : '',
    currentPropertyName: dto.currentPropertyName ?? '',
    rentalType: furnishingTypeToFrontendSafe(dto.rentalType),
    moveInDate: dto.moveInDate ?? '',
    leaseExpiryDate: dto.leaseExpiryDate ?? '',
    monthlyRent: dto.monthlyRent ?? 0,
    depositPaid: dto.depositPaid ?? 0,
    paymentStatus: dto.paymentStatus.toLowerCase() as Client['paymentStatus'],
    materials: dto.materials.map(toFrontendMaterial),
    documents: dto.documents.map(toFrontendDocument),
    status: dto.status.toLowerCase() as Client['status'],
    deactivationReason: dto.deactivationReason,
    deactivatedDate: dto.deactivatedDate,
    notes: dto.notes,
  };
}

// --- small local enum maps (kept here since they're specific to client sub-resources) ---

function furnishingTypeToFrontendSafe(value?: string): Client['rentalType'] {
  const map: Record<string, Client['rentalType']> = {
    FULLY_FURNISHED: 'Fully Furnished',
    SELF_FURNISHED: 'Self Furnished',
    SEMI_FURNISHED: 'Semi-Furnished',
    EXECUTIVE_LUXURY: 'Executive Luxury',
  };
  return value ? map[value] ?? 'Self Furnished' : 'Self Furnished';
}

const CONDITION_TO_FRONTEND: Record<string, ClientMaterial['condition']> = {
  EXCELLENT: 'Excellent',
  GOOD: 'Good',
  FAIR: 'Fair',
  NEEDS_REPAIR: 'Needs Repair',
};
const CONDITION_TO_BACKEND: Record<ClientMaterial['condition'], string> = {
  Excellent: 'EXCELLENT',
  Good: 'GOOD',
  Fair: 'FAIR',
  'Needs Repair': 'NEEDS_REPAIR',
};
function conditionToFrontend(value: string): ClientMaterial['condition'] {
  return CONDITION_TO_FRONTEND[value] ?? 'Good';
}
export function conditionToBackend(value: ClientMaterial['condition']): string {
  return CONDITION_TO_BACKEND[value];
}

const DOC_TYPE_TO_FRONTEND: Record<string, ClientDocument['type']> = {
  TENANCY_CONTRACT: 'Tenancy Contract',
  NATIONAL_ID: 'National ID',
  PASSPORT: 'Passport',
  PROOF_OF_INCOME: 'Proof of Income',
  WORK_PERMIT: 'Work Permit',
  MOVE_IN_INVENTORY: 'Move-In Inventory',
  DEPOSIT_GUARANTEE: 'Deposit Guarantee',
  OTHER: 'Other',
};
const DOC_TYPE_TO_BACKEND: Record<ClientDocument['type'], string> = {
  'Tenancy Contract': 'TENANCY_CONTRACT',
  'National ID': 'NATIONAL_ID',
  Passport: 'PASSPORT',
  'Proof of Income': 'PROOF_OF_INCOME',
  'Work Permit': 'WORK_PERMIT',
  'Move-In Inventory': 'MOVE_IN_INVENTORY',
  'Deposit Guarantee': 'DEPOSIT_GUARANTEE',
  Other: 'OTHER',
};
function documentTypeToFrontend(value: string): ClientDocument['type'] {
  return DOC_TYPE_TO_FRONTEND[value] ?? 'Other';
}
export function documentTypeToBackend(value: ClientDocument['type']): string {
  return DOC_TYPE_TO_BACKEND[value];
}

const DOC_STATUS_TO_FRONTEND: Record<string, ClientDocument['status']> = {
  VERIFIED: 'Verified',
  PENDING_REVIEW: 'Pending Review',
  EXPIRED: 'Expired',
};
const DOC_STATUS_TO_BACKEND: Record<ClientDocument['status'], string> = {
  Verified: 'VERIFIED',
  'Pending Review': 'PENDING_REVIEW',
  Expired: 'EXPIRED',
};
function documentStatusToFrontend(value: string): ClientDocument['status'] {
  return DOC_STATUS_TO_FRONTEND[value] ?? 'Pending Review';
}
export function documentStatusToBackend(value: ClientDocument['status']): string {
  return DOC_STATUS_TO_BACKEND[value];
}

export interface ClientFilters {
  status?: Client['status'];
  search?: string;
}

export function useClientsQuery(filters: ClientFilters = {}) {
  return useQuery({
    queryKey: ['clients', filters],
    queryFn: async () => {
      const res = await api.get<PageResponse<ClientResponseDto>>('/clients', {
        status: filters.status ? filters.status.toUpperCase() : undefined,
        search: filters.search || undefined,
        size: 100,
      });
      return res.content.map(toFrontend);
    },
  });
}

export function useClientQuery(id: string | undefined) {
  return useQuery({
    queryKey: ['client', id],
    queryFn: async () => toFrontend(await api.get<ClientResponseDto>(`/clients/${id}`)),
    enabled: !!id,
  });
}

/** Self-service — for the currently-logged-in CLIENT-role user. */
export function useMyClientQuery() {
  return useQuery({
    queryKey: ['client', 'me'],
    queryFn: async () => toFrontend(await api.get<ClientResponseDto>('/clients/me')),
  });
}

export interface ClientInput {
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  identificationNumber?: string;
  nationality?: string;
  occupation?: string;
  employer?: string;
  emergencyContact: { name: string; phone: string; relationship?: string };
  currentRoomId?: string;
  currentPropertyId?: string;
  rentalType?: Client['rentalType'];
  moveInDate?: string;
  leaseExpiryDate?: string;
  monthlyRent?: number;
  depositPaid?: number;
  notes?: string;
}

function toRequestBody(input: ClientInput) {
  return {
    name: input.name,
    email: input.email,
    phone: input.phone,
    avatarUrl: input.avatarUrl,
    identificationNumber: input.identificationNumber,
    nationality: input.nationality,
    occupation: input.occupation,
    employer: input.employer,
    emergencyContact: input.emergencyContact,
    currentRoomId: input.currentRoomId ? Number(input.currentRoomId) : undefined,
    currentPropertyId: input.currentPropertyId ? Number(input.currentPropertyId) : undefined,
    rentalType: input.rentalType ? backendFurnishingType(input.rentalType) : undefined,
    moveInDate: input.moveInDate,
    leaseExpiryDate: input.leaseExpiryDate,
    monthlyRent: input.monthlyRent,
    depositPaid: input.depositPaid,
    notes: input.notes,
  };
}

function backendFurnishingType(value: Client['rentalType']): string {
  const map: Record<Client['rentalType'], string> = {
    'Fully Furnished': 'FULLY_FURNISHED',
    'Self Furnished': 'SELF_FURNISHED',
    'Semi-Furnished': 'SEMI_FURNISHED',
    'Executive Luxury': 'EXECUTIVE_LUXURY',
  };
  return map[value];
}

export function useCreateClientMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ClientInput) => toFrontend(await api.post<ClientResponseDto>('/clients', toRequestBody(input))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });
}

export function useUpdateClientMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: ClientInput }) =>
      toFrontend(await api.put<ClientResponseDto>(`/clients/${id}`, toRequestBody(input))),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client', variables.id] });
    },
  });
}

export function useUpdateClientStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: Client['status']; reason?: string }) =>
      toFrontend(await api.patch<ClientResponseDto>(`/clients/${id}/status`, { status: status.toUpperCase(), reason })),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client', variables.id] });
    },
  });
}

export interface ClientMaterialInput {
  rentalTypeItemId?: string;
  name: string;
  quantity: number;
  condition: ClientMaterial['condition'];
  serialNumber?: string;
  category?: string;
}

export function useAddClientMaterialMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, input }: { clientId: string; input: ClientMaterialInput }) =>
      toFrontendMaterial(
        await api.post<ClientMaterialDto>(`/clients/${clientId}/materials`, {
          rentalTypeItemId: input.rentalTypeItemId ? Number(input.rentalTypeItemId) : undefined,
          name: input.name,
          quantity: input.quantity,
          condition: conditionToBackend(input.condition),
          serialNumber: input.serialNumber,
          category: input.category,
        })
      ),
    onSuccess: (_data, variables) => queryClient.invalidateQueries({ queryKey: ['client', variables.clientId] }),
  });
}

export function useUpdateClientMaterialConditionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, materialId, condition }: { clientId: string; materialId: string; condition: ClientMaterial['condition'] }) =>
      toFrontendMaterial(
        await api.patch<ClientMaterialDto>(`/clients/${clientId}/materials/${materialId}/condition`, {
          condition: conditionToBackend(condition),
        })
      ),
    onSuccess: (_data, variables) => queryClient.invalidateQueries({ queryKey: ['client', variables.clientId] }),
  });
}

export function useDeleteClientMaterialMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, materialId }: { clientId: string; materialId: string }) =>
      api.delete(`/clients/${clientId}/materials/${materialId}`),
    onSuccess: (_data, variables) => queryClient.invalidateQueries({ queryKey: ['client', variables.clientId] }),
  });
}

export interface ClientDocumentInput {
  name: string;
  type: ClientDocument['type'];
  fileUrl: string;
  sizeLabel?: string;
  status?: ClientDocument['status'];
}

export function useAddClientDocumentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, input }: { clientId: string; input: ClientDocumentInput }) =>
      toFrontendDocument(
        await api.post<ClientDocumentDto>(`/clients/${clientId}/documents`, {
          name: input.name,
          type: documentTypeToBackend(input.type),
          fileUrl: input.fileUrl,
          sizeLabel: input.sizeLabel,
          status: input.status ? documentStatusToBackend(input.status) : undefined,
        })
      ),
    onSuccess: (_data, variables) => queryClient.invalidateQueries({ queryKey: ['client', variables.clientId] }),
  });
}

export function useDeleteClientDocumentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, documentId }: { clientId: string; documentId: string }) =>
      api.delete(`/clients/${clientId}/documents/${documentId}`),
    onSuccess: (_data, variables) => queryClient.invalidateQueries({ queryKey: ['client', variables.clientId] }),
  });
}
