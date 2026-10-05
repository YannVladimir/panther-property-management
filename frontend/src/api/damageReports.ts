import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { PageResponse } from './pagination';
import { DamageReport } from '../types';

interface DamageReportResponseDto {
  id: number;
  propertyId: number;
  propertyName: string;
  roomId: number;
  roomNumber: string;
  clientId?: number;
  clientName?: string;
  item: string;
  damageType?: string;
  description?: string;
  reportedDate: string;
  photos: string[];
  estimatedCost?: number;
  amountCharged?: number;
  responsibleParty: string;
  status: string;
  resolutionNotes?: string;
}

const PARTY_TO_FRONTEND: Record<string, DamageReport['responsibleParty']> = {
  TENANT: 'Tenant',
  PROPERTY_OWNER: 'Property Owner',
  WEAR_AND_TEAR: 'Wear & Tear',
  CONTRACTOR: 'Contractor',
};
const PARTY_TO_BACKEND: Record<DamageReport['responsibleParty'], string> = {
  Tenant: 'TENANT',
  'Property Owner': 'PROPERTY_OWNER',
  'Wear & Tear': 'WEAR_AND_TEAR',
  Contractor: 'CONTRACTOR',
};

const STATUS_TO_FRONTEND: Record<string, DamageReport['status']> = {
  PENDING_REVIEW: 'Pending Review',
  IN_REPAIR: 'In Repair',
  RESOLVED: 'Resolved',
  DISPUTED: 'Disputed',
};
const STATUS_TO_BACKEND: Record<DamageReport['status'], string> = {
  'Pending Review': 'PENDING_REVIEW',
  'In Repair': 'IN_REPAIR',
  Resolved: 'RESOLVED',
  Disputed: 'DISPUTED',
};

function toFrontend(dto: DamageReportResponseDto): DamageReport {
  return {
    id: String(dto.id),
    propertyId: String(dto.propertyId),
    propertyName: dto.propertyName,
    roomId: String(dto.roomId),
    roomNumber: dto.roomNumber,
    clientId: dto.clientId !== undefined ? String(dto.clientId) : undefined,
    clientName: dto.clientName,
    item: dto.item,
    damageType: dto.damageType ?? '',
    description: dto.description ?? '',
    reportedDate: dto.reportedDate,
    photos: dto.photos,
    estimatedCost: dto.estimatedCost ?? 0,
    amountCharged: dto.amountCharged ?? 0,
    responsibleParty: PARTY_TO_FRONTEND[dto.responsibleParty] ?? 'Wear & Tear',
    status: STATUS_TO_FRONTEND[dto.status] ?? 'Pending Review',
    resolutionNotes: dto.resolutionNotes,
  };
}

export interface DamageReportFilters {
  propertyId?: string;
  clientId?: string;
  status?: DamageReport['status'];
}

export function useDamageReportsQuery(filters: DamageReportFilters = {}) {
  return useQuery({
    queryKey: ['damageReports', filters],
    queryFn: async () => {
      const res = await api.get<PageResponse<DamageReportResponseDto>>('/damages', {
        propertyId: filters.propertyId || undefined,
        clientId: filters.clientId || undefined,
        status: filters.status ? STATUS_TO_BACKEND[filters.status] : undefined,
        size: 100,
      });
      return res.content.map(toFrontend);
    },
  });
}

export interface DamageReportInput {
  propertyId: string;
  roomId: string;
  clientId?: string;
  item: string;
  damageType?: string;
  description?: string;
  reportedDate: string;
  photos?: string[];
  estimatedCost?: number;
  amountCharged?: number;
  responsibleParty: DamageReport['responsibleParty'];
}

function toRequestBody(input: DamageReportInput) {
  return {
    propertyId: Number(input.propertyId),
    roomId: Number(input.roomId),
    clientId: input.clientId ? Number(input.clientId) : undefined,
    item: input.item,
    damageType: input.damageType,
    description: input.description,
    reportedDate: input.reportedDate,
    photos: input.photos,
    estimatedCost: input.estimatedCost,
    amountCharged: input.amountCharged,
    responsibleParty: PARTY_TO_BACKEND[input.responsibleParty],
  };
}

export function useCreateDamageReportMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: DamageReportInput) => toFrontend(await api.post<DamageReportResponseDto>('/damages', toRequestBody(input))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['damageReports'] }),
  });
}

export function useUpdateDamageReportMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: DamageReportInput }) =>
      toFrontend(await api.put<DamageReportResponseDto>(`/damages/${id}`, toRequestBody(input))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['damageReports'] }),
  });
}

export function useUpdateDamageStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, resolutionNotes }: { id: string; status: DamageReport['status']; resolutionNotes?: string }) =>
      toFrontend(
        await api.patch<DamageReportResponseDto>(`/damages/${id}/status`, {
          status: STATUS_TO_BACKEND[status],
          resolutionNotes,
        })
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['damageReports'] }),
  });
}
