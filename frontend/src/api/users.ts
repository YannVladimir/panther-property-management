import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { PageResponse } from './pagination';
import { User, UserRole } from '../types';

interface UserResponseDto {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
  avatarUrl?: string;
  title?: string;
  clientId?: number;
  employeeId?: number;
  status: string;
  lastLoginAt?: string;
  mustChangePassword: boolean;
  createdAt: string;
}

export type AdminUserStatus = 'active' | 'inactive' | 'suspended';

/** The frontend's base `User` type (types/index.ts) only models what a logged-in session needs.
 * Admin user-management needs more (status/lastLogin/createdAt) — extended here rather than
 * widening the shared type for every other consumer. */
export interface AdminUser extends User {
  status: AdminUserStatus;
  lastLogin?: string;
  createdAt: string;
  mustChangePassword: boolean;
}

/** The backend has no avatar-upload capability at all (no field on Create/UpdateUserRequest) —
 * generate a stable placeholder from initials rather than pretend a URL was ever persisted. */
function placeholderAvatar(name: string): string {
  return `https://ui-avatars.com/api/?background=4f46e5&color=fff&name=${encodeURIComponent(name)}`;
}

function toFrontend(dto: UserResponseDto): AdminUser {
  return {
    id: String(dto.id),
    name: dto.name,
    email: dto.email,
    phone: dto.phone,
    role: dto.role.toLowerCase() as UserRole,
    avatar: dto.avatarUrl || placeholderAvatar(dto.name),
    title: dto.title,
    clientId: dto.clientId !== undefined ? String(dto.clientId) : undefined,
    employeeId: dto.employeeId !== undefined ? String(dto.employeeId) : undefined,
    status: dto.status.toLowerCase() as AdminUserStatus,
    lastLogin: dto.lastLoginAt ? dto.lastLoginAt.split('T')[0] : undefined,
    createdAt: dto.createdAt.split('T')[0],
    mustChangePassword: dto.mustChangePassword,
  };
}

export interface UserFilters {
  role?: UserRole;
  status?: AdminUserStatus;
  search?: string;
}

export function useUsersQuery(filters: UserFilters = {}) {
  return useQuery({
    queryKey: ['users', filters],
    queryFn: async () => {
      const res = await api.get<PageResponse<UserResponseDto>>('/users', {
        role: filters.role ? filters.role.toUpperCase() : undefined,
        status: filters.status ? filters.status.toUpperCase() : undefined,
        search: filters.search || undefined,
        size: 100,
      });
      return res.content.map(toFrontend);
    },
  });
}

export interface UserInput {
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  title?: string;
  clientId?: string;
  employeeId?: string;
}

function toRequestBody(input: UserInput) {
  return {
    name: input.name,
    email: input.email,
    phone: input.phone,
    role: input.role.toUpperCase(),
    title: input.title,
    clientId: input.clientId ? Number(input.clientId) : undefined,
    employeeId: input.employeeId ? Number(input.employeeId) : undefined,
  };
}

export function useCreateUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UserInput) => toFrontend(await api.post<UserResponseDto>('/users', toRequestBody(input))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useUpdateUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UserInput }) =>
      toFrontend(await api.put<UserResponseDto>(`/users/${id}`, toRequestBody(input))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useUpdateUserStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AdminUserStatus }) =>
      toFrontend(await api.patch<UserResponseDto>(`/users/${id}/status`, { status: status.toUpperCase() })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
}

/** Sends a real password-reset email via the same forgot-password flow a user would trigger themselves. */
export function useResetUserPasswordMutation() {
  return useMutation({
    mutationFn: async (id: string) => api.post<void>(`/users/${id}/reset-password`),
  });
}

/** Generates a fresh temporary password and re-sends the invite email — for users who never completed onboarding. */
export function useResendInviteMutation() {
  return useMutation({
    mutationFn: async (id: string) => api.post<void>(`/users/${id}/resend-invite`),
  });
}

export function useDeleteUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete<void>(`/users/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  themePreference: string;
}

/** Self-service — the logged-in user's own notification/theme preferences. */
export function useMyPreferencesQuery() {
  return useQuery({
    queryKey: ['users', 'me', 'preferences'],
    queryFn: async () => api.get<NotificationPreferences>('/users/me/preferences'),
  });
}

export function useUpdateMyPreferencesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: NotificationPreferences) => api.patch<NotificationPreferences>('/users/me/preferences', input),
    onSuccess: (data) => queryClient.setQueryData(['users', 'me', 'preferences'], data),
  });
}
