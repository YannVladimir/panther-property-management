import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { PageResponse } from './pagination';
import { NotificationItem } from '../types';

interface NotificationResponseDto {
  id: number;
  title: string;
  message: string;
  type: string;
  link?: string;
  createdAt: string;
  read: boolean;
}

const TYPE_TO_FRONTEND: Record<string, NotificationItem['type']> = {
  BOOKING: 'booking',
  PAYMENT: 'payment',
  MAINTENANCE: 'maintenance',
  SYSTEM: 'system',
  PAYROLL: 'payroll',
  ALERT: 'alert',
};

function toFrontend(dto: NotificationResponseDto): NotificationItem {
  return {
    id: String(dto.id),
    title: dto.title,
    message: dto.message,
    time: new Date(dto.createdAt).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    read: dto.read,
    type: TYPE_TO_FRONTEND[dto.type] ?? 'system',
    // Real notifications are already scoped to the logged-in user server-side (GET /notifications/me) —
    // targetRoles was a mock-only broadcast-filtering concept, kept only to satisfy the shared type.
    targetRoles: [],
    link: dto.link,
  };
}

/** Self-service — notifications addressed to the currently-logged-in user, server-scoped via the JWT. */
export function useMyNotificationsQuery() {
  return useQuery({
    queryKey: ['notifications', 'me'],
    queryFn: async () => {
      const res = await api.get<PageResponse<NotificationResponseDto>>('/notifications/me', { size: 50, sort: 'createdAt,desc' });
      return res.content.map(toFrontend);
    },
  });
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch<void>(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', 'me'] }),
  });
}

export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.patch<void>('/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', 'me'] }),
  });
}
