import { useQuery } from '@tanstack/react-query';
import { api } from './client';
import { PageResponse } from './pagination';
import { ActivityLog } from '../types';

interface ActivityLogResponseDto {
  id: number;
  occurredAt: string;
  userId?: number;
  userName: string;
  role: string;
  action: string;
  module: string;
  details: string;
  type: string;
}

/**
 * Exact `module` strings AuditService.log(...) calls use across every backend domain — confirmed
 * by grepping every call site, not guessed. The old mock-era dropdown ("Finance & Payments",
 * "Rooms & Estates", "Maintenance Issues", "Reports") never matched any of these, so those filter
 * options silently returned zero rows against the real API. This list is the source of truth for
 * what's actually filterable.
 */
export const ACTIVITY_LOG_MODULES = [
  'Properties',
  'Rooms',
  'Bookings',
  'Clients',
  'Agents',
  'Finance',
  'Expenses',
  'Preventive Maintenance',
  'Maintenance',
  'Damages',
  'Water Meters',
  'Technicians',
  'HR & Payroll',
  'HR & Tasks',
  'HR Incidents',
  'HR Leaves',
  'Users',
  'Reports',
] as const;

/**
 * The real activity_logs table mixes two shapes: rows written live by AuditService use the plain
 * enum name ("OPERATIONS", "PUBLIC", ...), but rows carried over from the original mock data during
 * the data migration already used a descriptive title ("Operations Director", "Household Manager").
 * Blindly title-casing every value would mangle the migrated rows (e.g. "Operations Director" ->
 * "Operations director"), so only the ALL-CAPS enum-style values get reformatted.
 */
function formatRole(role: string): string {
  if (role === role.toUpperCase()) {
    return role.charAt(0) + role.slice(1).toLowerCase();
  }
  return role;
}

function toFrontend(dto: ActivityLogResponseDto): ActivityLog {
  return {
    id: String(dto.id),
    timestamp: dto.occurredAt,
    userId: dto.userId !== undefined && dto.userId !== null ? String(dto.userId) : '',
    userName: dto.userName,
    role: formatRole(dto.role),
    action: dto.action,
    module: dto.module,
    details: dto.details,
    type: dto.type.toLowerCase() as ActivityLog['type'],
  };
}

export interface ActivityLogFilters {
  module?: string;
  type?: ActivityLog['type'];
}

export function useActivityLogsQuery(filters: ActivityLogFilters = {}) {
  return useQuery({
    queryKey: ['activityLogs', filters],
    queryFn: async () => {
      const res = await api.get<PageResponse<ActivityLogResponseDto>>('/activity-logs', {
        module: filters.module || undefined,
        type: filters.type ? filters.type.toUpperCase() : undefined,
        size: 200,
        sort: 'occurredAt,desc',
      });
      return res.content.map(toFrontend);
    },
  });
}
