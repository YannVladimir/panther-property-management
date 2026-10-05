import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { PageResponse } from './pagination';
import { IssuePriority, IssueStatus, MaintenanceIssue } from '../types';

interface MaintenanceIssueResponseDto {
  id: number;
  ticketNumber: string;
  clientId: number;
  clientName: string;
  propertyId: number;
  propertyName: string;
  roomId: number;
  roomNumber: string;
  category: string;
  title: string;
  description?: string;
  priority: string;
  photos: string[];
  status: string;
  reportedDate: string;
  assignedTechnicianId?: number;
  assignedTechnicianName?: string;
  technicianSpecialty?: string;
  resolutionDate?: string;
  resolutionNotes?: string;
}

const CATEGORY_TO_FRONTEND: Record<string, MaintenanceIssue['category']> = {
  PLUMBING: 'Plumbing',
  ELECTRICAL: 'Electrical',
  FURNITURE: 'Furniture',
  APPLIANCES: 'Appliances',
  HVAC: 'HVAC',
  STRUCTURAL: 'Structural',
  OTHER: 'Other',
};
const CATEGORY_TO_BACKEND: Record<MaintenanceIssue['category'], string> = {
  Plumbing: 'PLUMBING',
  Electrical: 'ELECTRICAL',
  Furniture: 'FURNITURE',
  Appliances: 'APPLIANCES',
  HVAC: 'HVAC',
  Structural: 'STRUCTURAL',
  Other: 'OTHER',
};

function priorityToFrontend(value: string): IssuePriority {
  const map: Record<string, IssuePriority> = { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High', EMERGENCY: 'Emergency' };
  return map[value] ?? 'Medium';
}
function priorityToBackend(value: IssuePriority): string {
  return value.toUpperCase();
}

function statusToFrontend(value: string): IssueStatus {
  const map: Record<string, IssueStatus> = {
    SUBMITTED: 'Submitted',
    REVIEWED: 'Reviewed',
    ASSIGNED: 'Assigned',
    IN_PROGRESS: 'In Progress',
    RESOLVED: 'Resolved',
    CLOSED: 'Closed',
  };
  return map[value] ?? 'Submitted';
}
function statusToBackend(value: IssueStatus): string {
  const map: Record<IssueStatus, string> = {
    Submitted: 'SUBMITTED',
    Reviewed: 'REVIEWED',
    Assigned: 'ASSIGNED',
    'In Progress': 'IN_PROGRESS',
    Resolved: 'RESOLVED',
    Closed: 'CLOSED',
  };
  return map[value];
}

function toFrontend(dto: MaintenanceIssueResponseDto): MaintenanceIssue {
  return {
    id: String(dto.id),
    ticketNumber: dto.ticketNumber,
    clientId: String(dto.clientId),
    clientName: dto.clientName,
    propertyId: String(dto.propertyId),
    propertyName: dto.propertyName,
    roomId: String(dto.roomId),
    roomNumber: dto.roomNumber,
    category: CATEGORY_TO_FRONTEND[dto.category] ?? 'Other',
    title: dto.title,
    description: dto.description ?? '',
    priority: priorityToFrontend(dto.priority),
    photos: dto.photos,
    status: statusToFrontend(dto.status),
    reportedDate: dto.reportedDate,
    assignedTechnicianId: dto.assignedTechnicianId !== undefined ? String(dto.assignedTechnicianId) : undefined,
    assignedTechnicianName: dto.assignedTechnicianName,
    technicianSpecialty: dto.technicianSpecialty,
    resolutionDate: dto.resolutionDate,
    resolutionNotes: dto.resolutionNotes,
  };
}

export interface MaintenanceIssueFilters {
  status?: IssueStatus;
  propertyId?: string;
  clientId?: string;
}

export function useMaintenanceIssuesQuery(filters: MaintenanceIssueFilters = {}) {
  return useQuery({
    queryKey: ['maintenanceIssues', filters],
    queryFn: async () => {
      const res = await api.get<PageResponse<MaintenanceIssueResponseDto>>('/maintenance-issues', {
        status: filters.status ? statusToBackend(filters.status) : undefined,
        propertyId: filters.propertyId || undefined,
        clientId: filters.clientId || undefined,
        size: 100,
      });
      return res.content.map(toFrontend);
    },
  });
}

/** Self-service — issues reported by the currently-logged-in CLIENT-role user. */
export function useMyMaintenanceIssuesQuery() {
  return useQuery({
    queryKey: ['maintenanceIssues', 'me'],
    queryFn: async () => {
      const res = await api.get<PageResponse<MaintenanceIssueResponseDto>>('/maintenance-issues/me', { size: 100 });
      return res.content.map(toFrontend);
    },
  });
}

export interface CreateMaintenanceIssueInput {
  propertyId: string;
  roomId: string;
  category: MaintenanceIssue['category'];
  title: string;
  description?: string;
  priority?: IssuePriority;
  photos?: string[];
}

export function useCreateMaintenanceIssueMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateMaintenanceIssueInput) =>
      toFrontend(
        await api.post<MaintenanceIssueResponseDto>('/maintenance-issues', {
          propertyId: Number(input.propertyId),
          roomId: Number(input.roomId),
          category: CATEGORY_TO_BACKEND[input.category],
          title: input.title,
          description: input.description,
          priority: input.priority ? priorityToBackend(input.priority) : undefined,
          photos: input.photos,
        })
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['maintenanceIssues'] }),
  });
}

export function useUpdateMaintenanceIssueStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      assignedTechnicianId,
      notes,
    }: {
      id: string;
      status: IssueStatus;
      assignedTechnicianId?: string;
      notes?: string;
    }) =>
      toFrontend(
        await api.patch<MaintenanceIssueResponseDto>(`/maintenance-issues/${id}/status`, {
          status: statusToBackend(status),
          assignedTechnicianId: assignedTechnicianId ? Number(assignedTechnicianId) : undefined,
          notes,
        })
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['maintenanceIssues'] }),
  });
}
