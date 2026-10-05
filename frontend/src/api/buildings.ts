import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { Building } from '../types';

interface BuildingResponseDto {
  id: number;
  propertyId: number;
  propertyName: string;
  name: string;
  floorsCount: number;
  totalRooms: number;
}

function toFrontend(dto: BuildingResponseDto): Building {
  return {
    id: String(dto.id),
    propertyId: String(dto.propertyId),
    propertyName: dto.propertyName,
    name: dto.name,
    floorsCount: dto.floorsCount,
    totalRooms: dto.totalRooms,
  };
}

export function useBuildingsQuery(propertyId?: string) {
  return useQuery({
    queryKey: ['buildings', propertyId],
    queryFn: async () => {
      const res = await api.get<BuildingResponseDto[]>('/buildings', {
        propertyId: propertyId || undefined,
      });
      return res.map(toFrontend);
    },
  });
}

export interface BuildingInput {
  propertyId: string;
  name: string;
  floorsCount: number;
}

export function useCreateBuildingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: BuildingInput) =>
      toFrontend(
        await api.post<BuildingResponseDto>('/buildings', {
          propertyId: Number(input.propertyId),
          name: input.name,
          floorsCount: input.floorsCount,
        })
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['buildings'] }),
  });
}

export function useUpdateBuildingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Omit<BuildingInput, 'propertyId'> }) =>
      toFrontend(
        await api.put<BuildingResponseDto>(`/buildings/${id}`, {
          name: input.name,
          floorsCount: input.floorsCount,
        })
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['buildings'] }),
  });
}

export function useDeleteBuildingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/buildings/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['buildings'] }),
  });
}
