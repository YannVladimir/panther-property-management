import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { RentalTypeConfig } from '../types';
import { furnishingTypeToBackend, furnishingTypeToFrontend, rentalTypeStatusToBackend, rentalTypeStatusToFrontend } from './enumMappers';

interface IncludedMaterialItemDto {
  id: number;
  name: string;
  quantity: number;
  condition: string;
  category?: string;
}

interface RentalTypeResponseDto {
  id: number;
  name: string;
  description?: string;
  priceMultiplier: number;
  includedMaterials: IncludedMaterialItemDto[];
  status: string;
  applicablePropertyIds: number[];
}

function toFrontend(dto: RentalTypeResponseDto): RentalTypeConfig {
  return {
    id: String(dto.id),
    name: furnishingTypeToFrontend(dto.name),
    description: dto.description ?? '',
    priceMultiplier: dto.priceMultiplier,
    includedMaterials: dto.includedMaterials.map((m) => ({
      id: String(m.id),
      name: m.name,
      quantity: m.quantity,
      condition: m.condition,
      category: m.category ?? '',
    })),
    status: rentalTypeStatusToFrontend(dto.status),
    applicablePropertyIds: dto.applicablePropertyIds.map(String),
  };
}

export function useRentalTypesQuery() {
  return useQuery({
    queryKey: ['rentalTypes'],
    queryFn: async () => (await api.get<RentalTypeResponseDto[]>('/rental-types')).map(toFrontend),
  });
}

export function useRentalTypeQuery(id: string | undefined) {
  return useQuery({
    queryKey: ['rentalType', id],
    queryFn: async () => toFrontend(await api.get<RentalTypeResponseDto>(`/rental-types/${id}`)),
    enabled: !!id,
  });
}

export type RentalTypeInput = Omit<RentalTypeConfig, 'id' | 'includedMaterials'> & {
  includedMaterials: Omit<RentalTypeConfig['includedMaterials'][number], 'id'>[];
};

function toRequestBody(input: RentalTypeInput) {
  return {
    name: furnishingTypeToBackend(input.name),
    description: input.description,
    priceMultiplier: input.priceMultiplier,
    includedMaterials: input.includedMaterials.map((m) => ({
      name: m.name,
      quantity: m.quantity,
      condition: m.condition,
      category: m.category,
    })),
    status: rentalTypeStatusToBackend(input.status),
    applicablePropertyIds: input.applicablePropertyIds.map(Number),
  };
}

export function useCreateRentalTypeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: RentalTypeInput) =>
      toFrontend(await api.post<RentalTypeResponseDto>('/rental-types', toRequestBody(input))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rentalTypes'] }),
  });
}

export function useUpdateRentalTypeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: RentalTypeInput }) =>
      toFrontend(await api.put<RentalTypeResponseDto>(`/rental-types/${id}`, toRequestBody(input))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rentalTypes'] }),
  });
}

export function useDeleteRentalTypeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/rental-types/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rentalTypes'] }),
  });
}
