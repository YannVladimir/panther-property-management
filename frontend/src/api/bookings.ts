import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { PageResponse } from './pagination';
import { Booking, BookingStatus } from '../types';

interface TimelineEventDto {
  status: string;
  occurredAt: string;
  note?: string;
  updatedByName: string;
}

interface BookingResponseDto {
  id: number;
  bookingNumber: string;
  clientId?: number;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  propertyId: number;
  propertyName: string;
  roomId?: number;
  roomNumber?: string;
  rentalTypeId: number;
  rentalTypeName: string;
  requestedDate: string;
  moveInDate: string;
  moveOutDate?: string;
  monthlyRent: number;
  deposit: number;
  status: string;
  notes?: string;
  source?: string;
  agentId?: number;
  agentName?: string;
  timeline: TimelineEventDto[];
}

const STATUS_TO_FRONTEND: Record<string, BookingStatus> = {
  REQUESTED: 'requested',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  ROOM_ASSIGNED: 'room_assigned',
  CONFIRMED: 'confirmed',
  CHECKED_IN: 'checked_in',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
};
const STATUS_TO_BACKEND: Record<BookingStatus, string> = {
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
function statusToFrontend(value: string): BookingStatus {
  return STATUS_TO_FRONTEND[value] ?? 'requested';
}
function statusToBackend(value: BookingStatus): string {
  return STATUS_TO_BACKEND[value];
}

const SOURCE_TO_FRONTEND: Record<string, NonNullable<Booking['source']>> = {
  CLIENT_PORTAL: 'client_portal',
  OPERATIONS_MANAGER: 'operations_manager',
  WALK_IN: 'walk_in',
  PHONE_INQUIRY: 'phone_inquiry',
  AGENT_REFERRAL: 'agent_referral',
};
const SOURCE_TO_BACKEND: Record<NonNullable<Booking['source']>, string> = {
  client_portal: 'CLIENT_PORTAL',
  operations_manager: 'OPERATIONS_MANAGER',
  walk_in: 'WALK_IN',
  phone_inquiry: 'PHONE_INQUIRY',
  agent_referral: 'AGENT_REFERRAL',
};

function toFrontend(dto: BookingResponseDto): Booking {
  return {
    id: String(dto.id),
    bookingNumber: dto.bookingNumber,
    clientId: dto.clientId !== undefined ? String(dto.clientId) : undefined,
    clientName: dto.clientName,
    clientEmail: dto.clientEmail ?? '',
    clientPhone: dto.clientPhone ?? '',
    propertyId: String(dto.propertyId),
    propertyName: dto.propertyName,
    roomId: dto.roomId !== undefined ? String(dto.roomId) : undefined,
    roomNumber: dto.roomNumber,
    rentalTypeId: String(dto.rentalTypeId),
    rentalTypeName: dto.rentalTypeName,
    requestedDate: dto.requestedDate,
    moveInDate: dto.moveInDate,
    moveOutDate: dto.moveOutDate,
    monthlyRent: dto.monthlyRent,
    deposit: dto.deposit,
    status: statusToFrontend(dto.status),
    notes: dto.notes,
    source: dto.source ? SOURCE_TO_FRONTEND[dto.source] : undefined,
    agentId: dto.agentId !== undefined ? String(dto.agentId) : undefined,
    agentName: dto.agentName,
    timeline: dto.timeline.map((t) => ({
      status: statusToFrontend(t.status),
      timestamp: t.occurredAt,
      note: t.note,
      updatedBy: t.updatedByName,
    })),
  };
}

export interface BookingFilters {
  status?: BookingStatus;
  propertyId?: string;
  search?: string;
}

export function useBookingsQuery(filters: BookingFilters = {}) {
  return useQuery({
    queryKey: ['bookings', filters],
    queryFn: async () => {
      const res = await api.get<PageResponse<BookingResponseDto>>('/bookings', {
        status: filters.status ? statusToBackend(filters.status) : undefined,
        propertyId: filters.propertyId || undefined,
        search: filters.search || undefined,
        size: 100,
      });
      return res.content.map(toFrontend);
    },
  });
}

export function useBookingQuery(id: string | undefined) {
  return useQuery({
    queryKey: ['booking', id],
    queryFn: async () => toFrontend(await api.get<BookingResponseDto>(`/bookings/${id}`)),
    enabled: !!id,
  });
}

/** Self-service — bookings belonging to the currently-logged-in CLIENT-role user. */
export function useMyBookingsQuery() {
  return useQuery({
    queryKey: ['bookings', 'me'],
    queryFn: async () => {
      const res = await api.get<PageResponse<BookingResponseDto>>('/clients/me/bookings', { size: 100 });
      return res.content.map(toFrontend);
    },
  });
}

export interface CreateBookingInput {
  clientId?: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  propertyId: string;
  roomId?: string;
  rentalTypeId: string;
  moveInDate: string;
  moveOutDate?: string;
  monthlyRent: number;
  deposit?: number;
  notes?: string;
  source?: Booking['source'];
  agentId?: string;
  status?: BookingStatus;
}

export function useCreateBookingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateBookingInput) => {
      const body = {
        clientId: input.clientId ? Number(input.clientId) : undefined,
        clientName: input.clientName,
        clientEmail: input.clientEmail,
        clientPhone: input.clientPhone,
        propertyId: Number(input.propertyId),
        roomId: input.roomId ? Number(input.roomId) : undefined,
        rentalTypeId: Number(input.rentalTypeId),
        moveInDate: input.moveInDate,
        moveOutDate: input.moveOutDate,
        monthlyRent: input.monthlyRent,
        deposit: input.deposit,
        notes: input.notes,
        source: input.source ? SOURCE_TO_BACKEND[input.source] : undefined,
        agentId: input.agentId ? Number(input.agentId) : undefined,
        status: input.status ? statusToBackend(input.status) : undefined,
      };
      // Anonymous-capable: POST /bookings is public, but api.post still attaches a token if one exists.
      return toFrontend(await api.post<BookingResponseDto>('/bookings', body));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings'] }),
  });
}

export function useUpdateBookingStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, note }: { id: string; status: BookingStatus; note?: string }) =>
      toFrontend(await api.patch<BookingResponseDto>(`/bookings/${id}/status`, { status: statusToBackend(status), note })),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

export function useAssignRoomMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, roomId }: { id: string; roomId: string }) =>
      toFrontend(await api.patch<BookingResponseDto>(`/bookings/${id}/assign-room`, { roomId: Number(roomId) })),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}
