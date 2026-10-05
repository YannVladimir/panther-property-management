import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { PageResponse } from './pagination';
import { FurnishingType, Room, RoomStatus } from '../types';
import { furnishingTypeToBackend, furnishingTypeToFrontend, roomStatusToBackend, roomStatusToFrontend } from './enumMappers';

interface RoomResponseDto {
  id: number;
  propertyId: number;
  propertyName: string;
  buildingId?: number;
  buildingName?: string;
  roomNumber: string;
  floor: number;
  sizeSqM?: number;
  bedrooms: number;
  bathrooms: number;
  furnishingType: string;
  monthlyRent: number;
  deposit: number;
  status: string;
  amenities: string[];
  utilitiesIncluded: string[];
  rules: string[];
  images: string[];
  currentClientId?: number;
  virtualTourUrl?: string;
  description?: string;
}

function toFrontend(dto: RoomResponseDto): Room {
  return {
    id: String(dto.id),
    propertyId: String(dto.propertyId),
    propertyName: dto.propertyName,
    buildingId: dto.buildingId !== undefined ? String(dto.buildingId) : '',
    buildingName: dto.buildingName ?? '',
    roomNumber: dto.roomNumber,
    floor: dto.floor,
    sizeSqM: dto.sizeSqM ?? 0,
    bedrooms: dto.bedrooms,
    bathrooms: dto.bathrooms,
    furnishingType: furnishingTypeToFrontend(dto.furnishingType),
    monthlyRent: dto.monthlyRent,
    deposit: dto.deposit,
    status: roomStatusToFrontend(dto.status),
    amenities: dto.amenities,
    utilitiesIncluded: dto.utilitiesIncluded,
    rules: dto.rules,
    images: dto.images,
    currentClientId: dto.currentClientId !== undefined ? String(dto.currentClientId) : undefined,
    // Client name enrichment needs the leasing domain (not wired yet) — left blank for now.
    currentClientName: undefined,
    virtualTourUrl: dto.virtualTourUrl,
    description: dto.description ?? '',
  };
}

export interface RoomFilters {
  propertyId?: string;
  status?: RoomStatus;
  furnishingType?: FurnishingType;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

export function useRoomsQuery(filters: RoomFilters = {}) {
  return useQuery({
    queryKey: ['rooms', filters],
    queryFn: async () => {
      const res = await api.get<PageResponse<RoomResponseDto>>('/rooms', {
        propertyId: filters.propertyId || undefined,
        status: filters.status ? roomStatusToBackend(filters.status) : undefined,
        furnishingType: filters.furnishingType ? furnishingTypeToBackend(filters.furnishingType) : undefined,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        search: filters.search || undefined,
        size: 100,
      });
      return res.content.map(toFrontend);
    },
  });
}

export function useRoomQuery(id: string | undefined) {
  return useQuery({
    queryKey: ['room', id],
    queryFn: async () => toFrontend(await api.get<RoomResponseDto>(`/rooms/${id}`)),
    enabled: !!id,
  });
}

export type RoomInput = Omit<Room, 'id' | 'propertyName' | 'buildingName' | 'currentClientId' | 'currentClientName'>;

function toRequestBody(input: RoomInput) {
  return {
    propertyId: Number(input.propertyId),
    buildingId: input.buildingId ? Number(input.buildingId) : undefined,
    roomNumber: input.roomNumber,
    floor: input.floor,
    sizeSqM: input.sizeSqM,
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    furnishingType: furnishingTypeToBackend(input.furnishingType),
    monthlyRent: input.monthlyRent,
    deposit: input.deposit,
    status: roomStatusToBackend(input.status),
    amenities: input.amenities,
    utilitiesIncluded: input.utilitiesIncluded,
    rules: input.rules,
    images: input.images,
    virtualTourUrl: input.virtualTourUrl,
    description: input.description,
  };
}

export function useCreateRoomMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: RoomInput) => toFrontend(await api.post<RoomResponseDto>('/rooms', toRequestBody(input))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });
}

export function useUpdateRoomMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: RoomInput }) =>
      toFrontend(await api.put<RoomResponseDto>(`/rooms/${id}`, toRequestBody(input))),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['room', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });
}

export function useUpdateRoomStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: RoomStatus }) =>
      toFrontend(await api.patch<RoomResponseDto>(`/rooms/${id}/status`, { status: roomStatusToBackend(status) })),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['room', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });
}

export function useDeleteRoomMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/rooms/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });
}
