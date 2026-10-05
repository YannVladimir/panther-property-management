import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { PageResponse } from './pagination';
import { Property, PropertyStatus } from '../types';
import { propertyStatusToBackend, propertyStatusToFrontend } from './enumMappers';

interface PropertyResponseDto {
  id: number;
  name: string;
  code: string;
  location: string;
  neighborhood?: string;
  city?: string;
  address?: string;
  images: string[];
  amenities: string[];
  description?: string;
  rating: number;
  reviewCount: number;
  featured: boolean;
  yearBuilt?: number;
  monthlyRevenueEstimate: number;
  status: string;
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  reservedRooms: number;
  maintenanceRooms: number;
}

function toFrontend(dto: PropertyResponseDto): Property {
  return {
    id: String(dto.id),
    name: dto.name,
    code: dto.code,
    location: dto.location,
    neighborhood: dto.neighborhood ?? '',
    city: dto.city ?? '',
    address: dto.address ?? '',
    totalRooms: dto.totalRooms,
    occupiedRooms: dto.occupiedRooms,
    availableRooms: dto.availableRooms,
    reservedRooms: dto.reservedRooms,
    maintenanceRooms: dto.maintenanceRooms,
    images: dto.images,
    amenities: dto.amenities,
    description: dto.description ?? '',
    rating: dto.rating,
    reviewCount: dto.reviewCount,
    featured: dto.featured,
    yearBuilt: dto.yearBuilt ?? 0,
    monthlyRevenueEstimate: dto.monthlyRevenueEstimate,
    status: propertyStatusToFrontend(dto.status),
  };
}

export interface PropertyFilters {
  status?: PropertyStatus;
  search?: string;
}

export function usePropertiesQuery(filters: PropertyFilters = {}) {
  return useQuery({
    queryKey: ['properties', filters],
    queryFn: async () => {
      const res = await api.get<PageResponse<PropertyResponseDto>>('/properties', {
        status: filters.status ? propertyStatusToBackend(filters.status) : undefined,
        search: filters.search || undefined,
        size: 100,
      });
      return res.content.map(toFrontend);
    },
  });
}

export function usePropertyQuery(id: string | undefined) {
  return useQuery({
    queryKey: ['property', id],
    queryFn: async () => toFrontend(await api.get<PropertyResponseDto>(`/properties/${id}`)),
    enabled: !!id,
  });
}

export type PropertyInput = Omit<
  Property,
  'id' | 'code' | 'totalRooms' | 'occupiedRooms' | 'availableRooms' | 'reservedRooms' | 'maintenanceRooms' | 'reviewCount'
> & { reviewCount?: number };

function toRequestBody(input: PropertyInput) {
  return {
    name: input.name,
    location: input.location,
    neighborhood: input.neighborhood,
    city: input.city,
    address: input.address,
    images: input.images,
    amenities: input.amenities,
    description: input.description,
    rating: input.rating,
    reviewCount: input.reviewCount,
    yearBuilt: input.yearBuilt,
    monthlyRevenueEstimate: input.monthlyRevenueEstimate,
    featured: input.featured,
    status: propertyStatusToBackend(input.status),
  };
}

export function useCreatePropertyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: PropertyInput) =>
      toFrontend(await api.post<PropertyResponseDto>('/properties', toRequestBody(input))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['properties'] }),
  });
}

export function useUpdatePropertyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: PropertyInput }) =>
      toFrontend(await api.put<PropertyResponseDto>(`/properties/${id}`, toRequestBody(input))),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['property', variables.id] });
    },
  });
}

export function useDeletePropertyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/properties/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['properties'] }),
  });
}
