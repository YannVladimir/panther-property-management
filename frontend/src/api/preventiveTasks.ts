import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { PageResponse } from './pagination';
import { InspectionStatus, PreventiveCategory, PreventiveTask } from '../types';

interface PreventiveTaskResponseDto {
  id: number;
  propertyId: number;
  propertyName: string;
  category: string;
  taskName: string;
  frequency: string;
  scheduleWeek: number;
  assignedStaffId?: number;
  assignedStaffName?: string;
  status: string;
  remarks?: string;
  evidencePhotos: string[];
  lastCompletedDate?: string;
  dueDate: string;
  resolvedDate?: string;
}

const CATEGORY_TO_FRONTEND: Record<string, PreventiveCategory> = {
  COMMON_AREAS: 'Common Areas',
  CORRIDORS: 'Corridors',
  STAIRCASES: 'Staircases',
  COMPOUND_AND_PARKING: 'Compound & Parking',
  LIGHTING_SYSTEMS: 'Lighting Systems',
  TILES_AND_FLOORS: 'Tiles & Floors',
  WALLS_AND_PAINTING: 'Walls & Painting',
  WINDOWS_AND_DOORS: 'Windows & Doors',
  HANDRAILS_AND_BALCONIES: 'Handrails & Balconies',
  WALKWAYS: 'Walkways',
  WASTE_MANAGEMENT: 'Waste Management',
  ELECTRICAL_SYSTEM: 'Electrical System',
  ROOF_AND_DRAINAGE: 'Roof & Drainage',
  PEST_CONTROL: 'Pest Control',
  GARDEN_AND_LANDSCAPING: 'Garden & Landscaping',
};
const CATEGORY_TO_BACKEND: Record<PreventiveCategory, string> = Object.fromEntries(
  Object.entries(CATEGORY_TO_FRONTEND).map(([k, v]) => [v, k])
) as Record<PreventiveCategory, string>;

const FREQUENCY_TO_FRONTEND: Record<string, PreventiveTask['frequency']> = {
  WEEKLY: 'Weekly',
  BI_WEEKLY: 'Bi-Weekly',
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  CUSTOM: 'Custom',
};
const FREQUENCY_TO_BACKEND: Record<PreventiveTask['frequency'], string> = {
  Weekly: 'WEEKLY',
  'Bi-Weekly': 'BI_WEEKLY',
  Monthly: 'MONTHLY',
  Quarterly: 'QUARTERLY',
  Custom: 'CUSTOM',
};

function statusToFrontend(value: string): InspectionStatus {
  return value.toLowerCase() as InspectionStatus;
}
function statusToBackend(value: InspectionStatus): string {
  return value.toUpperCase();
}

function toFrontend(dto: PreventiveTaskResponseDto): PreventiveTask {
  return {
    id: String(dto.id),
    propertyId: String(dto.propertyId),
    propertyName: dto.propertyName,
    category: CATEGORY_TO_FRONTEND[dto.category] ?? 'Common Areas',
    taskName: dto.taskName,
    frequency: FREQUENCY_TO_FRONTEND[dto.frequency] ?? 'Monthly',
    scheduleWeek: dto.scheduleWeek,
    assignedStaffId: dto.assignedStaffId !== undefined ? String(dto.assignedStaffId) : '',
    assignedStaffName: dto.assignedStaffName ?? '',
    status: statusToFrontend(dto.status),
    remarks: dto.remarks ?? '',
    evidencePhotos: dto.evidencePhotos,
    lastCompletedDate: dto.lastCompletedDate,
    dueDate: dto.dueDate,
    resolvedDate: dto.resolvedDate,
  };
}

export interface PreventiveTaskFilters {
  propertyId?: string;
  status?: InspectionStatus;
}

export function usePreventiveTasksQuery(filters: PreventiveTaskFilters = {}) {
  return useQuery({
    queryKey: ['preventiveTasks', filters],
    queryFn: async () => {
      const res = await api.get<PageResponse<PreventiveTaskResponseDto>>('/preventive-tasks', {
        propertyId: filters.propertyId || undefined,
        status: filters.status ? statusToBackend(filters.status) : undefined,
        size: 100,
      });
      return res.content.map(toFrontend);
    },
  });
}

/** Self-service — "My Checklist" for the currently-logged-in HOUSEHOLD-role user. */
export function useMyPreventiveTasksQuery() {
  return useQuery({
    queryKey: ['preventiveTasks', 'me'],
    queryFn: async () => {
      const res = await api.get<PageResponse<PreventiveTaskResponseDto>>('/preventive-tasks/me', { size: 100 });
      return res.content.map(toFrontend);
    },
  });
}

export interface PreventiveTaskInput {
  propertyId: string;
  category: PreventiveCategory;
  taskName: string;
  frequency: PreventiveTask['frequency'];
  scheduleWeek: number;
  assignedStaffId?: string;
  assignedStaffName?: string;
  dueDate: string;
}

export function useCreatePreventiveTaskMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: PreventiveTaskInput) =>
      toFrontend(
        await api.post<PreventiveTaskResponseDto>('/preventive-tasks', {
          propertyId: Number(input.propertyId),
          category: CATEGORY_TO_BACKEND[input.category],
          taskName: input.taskName,
          frequency: FREQUENCY_TO_BACKEND[input.frequency],
          scheduleWeek: input.scheduleWeek,
          assignedStaffId: input.assignedStaffId ? Number(input.assignedStaffId) : undefined,
          assignedStaffName: input.assignedStaffName,
          dueDate: input.dueDate,
        })
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['preventiveTasks'] }),
  });
}

export function useUpdatePreventiveTaskStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      remarks,
      evidencePhotos,
    }: {
      id: string;
      status: InspectionStatus;
      remarks?: string;
      evidencePhotos?: string[];
    }) =>
      toFrontend(
        await api.patch<PreventiveTaskResponseDto>(`/preventive-tasks/${id}/status`, {
          status: statusToBackend(status),
          remarks,
          evidencePhotos,
        })
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preventiveTasks'] });
    },
  });
}
