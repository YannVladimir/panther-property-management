import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { PageResponse } from './pagination';
import {
  Employee,
  EmployeeDailyTask,
  EmployeeDamage,
  EmployeeDocument,
  EmployeeLeave,
} from '../types';

interface EmergencyContactDto {
  name: string;
  phone: string;
  relationship: string;
}

interface EmployeeDocumentDto {
  id: number;
  name: string;
  type: string;
  fileUrl: string;
  uploadDate: string;
  sizeLabel?: string;
  status: string;
}

interface EmployeeDailyTaskDto {
  id: number;
  title: string;
  description?: string;
  assignedDate: string;
  dueDate: string;
  priority: string;
  propertyId?: number;
  propertyName?: string;
  roomNumber?: string;
  status: string;
  completedDate?: string;
  managerComment?: string;
  rating?: number;
  ratedByName?: string;
}

interface EmployeeDamageDto {
  id: number;
  incidentDate: string;
  item: string;
  propertyName?: string;
  roomNumber?: string;
  description?: string;
  estimatedCost?: number;
  deductedFromSalary: boolean;
  deductedAmount?: number;
  status: string;
  photos: string[];
}

interface EmployeeLeaveDto {
  id: number;
  leaveType: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason?: string;
  status: string;
  approvedByName?: string;
  requestedDate: string;
}

interface EmployeeResponseDto {
  id: number;
  name: string;
  avatarUrl?: string;
  position: string;
  department: string;
  contact: string;
  email?: string;
  employmentStatus: string;
  status: string;
  statusReason?: string;
  startDate: string;
  basicSalary: number;
  nationalId?: string;
  emergencyContact?: EmergencyContactDto;
  address?: string;
  documents: EmployeeDocumentDto[];
  dailyTasks: EmployeeDailyTaskDto[];
  damages: EmployeeDamageDto[];
  leaves: EmployeeLeaveDto[];
}

const DEPARTMENT_TO_FRONTEND: Record<string, Employee['department']> = {
  OPERATIONS: 'Operations',
  MAINTENANCE: 'Maintenance',
  HOUSEKEEPING: 'Housekeeping',
  SECURITY: 'Security',
  FINANCE: 'Finance',
  MANAGEMENT: 'Management',
};
const DEPARTMENT_TO_BACKEND: Record<Employee['department'], string> = {
  Operations: 'OPERATIONS',
  Maintenance: 'MAINTENANCE',
  Housekeeping: 'HOUSEKEEPING',
  Security: 'SECURITY',
  Finance: 'FINANCE',
  Management: 'MANAGEMENT',
};

const EMPLOYMENT_STATUS_TO_FRONTEND: Record<string, Employee['employmentStatus']> = {
  FULL_TIME: 'Full-Time',
  PART_TIME: 'Part-Time',
  CONTRACT: 'Contract',
};
const EMPLOYMENT_STATUS_TO_BACKEND: Record<Employee['employmentStatus'], string> = {
  'Full-Time': 'FULL_TIME',
  'Part-Time': 'PART_TIME',
  Contract: 'CONTRACT',
};

const STATUS_TO_FRONTEND: Record<string, Employee['status']> = {
  ACTIVE: 'active',
  ON_LEAVE: 'on_leave',
  SUSPENDED: 'suspended',
  TERMINATED: 'terminated',
};
const STATUS_TO_BACKEND: Record<Employee['status'], string> = {
  active: 'ACTIVE',
  on_leave: 'ON_LEAVE',
  suspended: 'SUSPENDED',
  terminated: 'TERMINATED',
};

const DOC_TYPE_TO_FRONTEND: Record<string, EmployeeDocument['type']> = {
  EMPLOYMENT_CONTRACT: 'Employment Contract',
  NATIONAL_ID_PASSPORT: 'National ID / Passport',
  CRIMINAL_RECORD_CLEARANCE: 'Criminal Record Clearance',
  HEALTH_INSURANCE: 'Health Insurance',
  CERTIFICATE_DEGREE: 'Certificate / Degree',
  OTHER: 'Other',
};
const DOC_TYPE_TO_BACKEND: Record<EmployeeDocument['type'], string> = {
  'Employment Contract': 'EMPLOYMENT_CONTRACT',
  'National ID / Passport': 'NATIONAL_ID_PASSPORT',
  'Criminal Record Clearance': 'CRIMINAL_RECORD_CLEARANCE',
  'Health Insurance': 'HEALTH_INSURANCE',
  'Certificate / Degree': 'CERTIFICATE_DEGREE',
  Other: 'OTHER',
};

const DOC_STATUS_TO_FRONTEND: Record<string, EmployeeDocument['status']> = {
  VERIFIED: 'Verified',
  PENDING_REVIEW: 'Pending Review',
  EXPIRED: 'Expired',
};
const DOC_STATUS_TO_BACKEND: Record<EmployeeDocument['status'], string> = {
  Verified: 'VERIFIED',
  'Pending Review': 'PENDING_REVIEW',
  Expired: 'EXPIRED',
};

const TASK_PRIORITY_TO_FRONTEND: Record<string, EmployeeDailyTask['priority']> = {
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
};
const TASK_PRIORITY_TO_BACKEND: Record<EmployeeDailyTask['priority'], string> = {
  High: 'HIGH',
  Medium: 'MEDIUM',
  Low: 'LOW',
};

const TASK_STATUS_TO_FRONTEND: Record<string, EmployeeDailyTask['status']> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
};
const TASK_STATUS_TO_BACKEND: Record<EmployeeDailyTask['status'], string> = {
  Pending: 'PENDING',
  'In Progress': 'IN_PROGRESS',
  Completed: 'COMPLETED',
  Rejected: 'REJECTED',
};

const DAMAGE_STATUS_TO_FRONTEND: Record<string, EmployeeDamage['status']> = {
  INVESTIGATING: 'Investigating',
  DEDUCTED: 'Deducted',
  FORGIVEN: 'Forgiven',
  SETTLED: 'Settled',
};

const LEAVE_TYPE_TO_FRONTEND: Record<string, EmployeeLeave['leaveType']> = {
  ANNUAL_LEAVE: 'Annual Leave',
  SICK_LEAVE: 'Sick Leave',
  MATERNITY_PATERNITY: 'Maternity / Paternity',
  COMPASSIONATE_LEAVE: 'Compassionate Leave',
  UNPAID_LEAVE: 'Unpaid Leave',
};
const LEAVE_TYPE_TO_BACKEND: Record<EmployeeLeave['leaveType'], string> = {
  'Annual Leave': 'ANNUAL_LEAVE',
  'Sick Leave': 'SICK_LEAVE',
  'Maternity / Paternity': 'MATERNITY_PATERNITY',
  'Compassionate Leave': 'COMPASSIONATE_LEAVE',
  'Unpaid Leave': 'UNPAID_LEAVE',
};

const LEAVE_STATUS_TO_FRONTEND: Record<string, EmployeeLeave['status']> = {
  APPROVED: 'Approved',
  PENDING: 'Pending',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};
const LEAVE_STATUS_TO_BACKEND: Record<EmployeeLeave['status'], string> = {
  Approved: 'APPROVED',
  Pending: 'PENDING',
  Completed: 'COMPLETED',
  Cancelled: 'CANCELLED',
};

/** The backend has no avatar-upload capability at all (no field on Create/UpdateEmployeeRequest) — generate a stable placeholder from initials rather than pretend a URL was ever persisted. */
function placeholderAvatar(name: string): string {
  return `https://ui-avatars.com/api/?background=0D9488&color=fff&name=${encodeURIComponent(name)}`;
}

function toFrontendDocument(dto: EmployeeDocumentDto): EmployeeDocument {
  return {
    id: String(dto.id),
    name: dto.name,
    type: DOC_TYPE_TO_FRONTEND[dto.type] ?? 'Other',
    fileUrl: dto.fileUrl,
    uploadDate: dto.uploadDate,
    size: dto.sizeLabel,
    status: DOC_STATUS_TO_FRONTEND[dto.status] ?? 'Pending Review',
  };
}

function toFrontendDailyTask(dto: EmployeeDailyTaskDto): EmployeeDailyTask {
  return {
    id: String(dto.id),
    title: dto.title,
    description: dto.description ?? '',
    assignedDate: dto.assignedDate,
    dueDate: dto.dueDate,
    priority: TASK_PRIORITY_TO_FRONTEND[dto.priority] ?? 'Medium',
    propertyId: dto.propertyId !== undefined ? String(dto.propertyId) : undefined,
    propertyName: dto.propertyName,
    roomNumber: dto.roomNumber,
    status: TASK_STATUS_TO_FRONTEND[dto.status] ?? 'Pending',
    completedDate: dto.completedDate,
    managerComment: dto.managerComment,
    rating: dto.rating,
    ratedBy: dto.ratedByName,
  };
}

function toFrontendDamage(dto: EmployeeDamageDto): EmployeeDamage {
  return {
    id: String(dto.id),
    incidentDate: dto.incidentDate,
    item: dto.item,
    propertyName: dto.propertyName ?? '',
    roomNumber: dto.roomNumber,
    description: dto.description ?? '',
    estimatedCost: dto.estimatedCost ?? 0,
    deductedFromSalary: dto.deductedFromSalary,
    deductedAmount: dto.deductedAmount ?? 0,
    status: DAMAGE_STATUS_TO_FRONTEND[dto.status] ?? 'Investigating',
    photos: dto.photos,
  };
}

function toFrontendLeave(dto: EmployeeLeaveDto): EmployeeLeave {
  return {
    id: String(dto.id),
    leaveType: LEAVE_TYPE_TO_FRONTEND[dto.leaveType] ?? 'Annual Leave',
    startDate: dto.startDate,
    endDate: dto.endDate,
    daysCount: dto.daysCount,
    reason: dto.reason ?? '',
    status: LEAVE_STATUS_TO_FRONTEND[dto.status] ?? 'Pending',
    approvedBy: dto.approvedByName,
    requestedDate: dto.requestedDate,
  };
}

function toFrontend(dto: EmployeeResponseDto): Employee {
  return {
    id: String(dto.id),
    name: dto.name,
    avatar: dto.avatarUrl || placeholderAvatar(dto.name),
    position: dto.position,
    department: DEPARTMENT_TO_FRONTEND[dto.department] ?? 'Operations',
    contact: dto.contact,
    email: dto.email ?? '',
    employmentStatus: EMPLOYMENT_STATUS_TO_FRONTEND[dto.employmentStatus] ?? 'Full-Time',
    status: STATUS_TO_FRONTEND[dto.status] ?? 'active',
    statusReason: dto.statusReason,
    startDate: dto.startDate,
    basicSalary: dto.basicSalary,
    nationalId: dto.nationalId ?? '',
    emergencyContact: dto.emergencyContact,
    address: dto.address,
    documents: dto.documents.map(toFrontendDocument),
    dailyTasks: dto.dailyTasks.map(toFrontendDailyTask),
    damages: dto.damages.map(toFrontendDamage),
    leaves: dto.leaves.map(toFrontendLeave),
  };
}

export interface EmployeeFilters {
  department?: Employee['department'];
  status?: Employee['status'];
  search?: string;
}

export function useEmployeesQuery(filters: EmployeeFilters = {}) {
  return useQuery({
    queryKey: ['employees', filters],
    queryFn: async () => {
      const res = await api.get<PageResponse<EmployeeResponseDto>>('/employees', {
        department: filters.department ? DEPARTMENT_TO_BACKEND[filters.department] : undefined,
        status: filters.status ? STATUS_TO_BACKEND[filters.status] : undefined,
        search: filters.search || undefined,
        size: 200,
      });
      return res.content.map(toFrontend);
    },
  });
}

export function useEmployeeQuery(id: string | undefined) {
  return useQuery({
    queryKey: ['employee', id],
    queryFn: async () => toFrontend(await api.get<EmployeeResponseDto>(`/employees/${id}`)),
    enabled: !!id,
  });
}

/** Self-service — the currently-logged-in HOUSEHOLD-role user's own employee profile. */
export function useMyEmployeeQuery() {
  return useQuery({
    queryKey: ['employee', 'me'],
    queryFn: async () => toFrontend(await api.get<EmployeeResponseDto>('/employees/me')),
  });
}

export interface EmployeeInput {
  name: string;
  position: string;
  department: Employee['department'];
  contact: string;
  email?: string;
  employmentStatus: Employee['employmentStatus'];
  startDate: string;
  basicSalary: number;
  nationalId?: string;
  emergencyContact?: { name: string; phone: string; relationship: string };
  address?: string;
}

function toRequestBody(input: EmployeeInput) {
  return {
    name: input.name,
    position: input.position,
    department: DEPARTMENT_TO_BACKEND[input.department],
    contact: input.contact,
    email: input.email,
    employmentStatus: EMPLOYMENT_STATUS_TO_BACKEND[input.employmentStatus],
    startDate: input.startDate,
    basicSalary: input.basicSalary,
    nationalId: input.nationalId,
    emergencyContact: input.emergencyContact,
    address: input.address,
  };
}

export function useCreateEmployeeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: EmployeeInput) => toFrontend(await api.post<EmployeeResponseDto>('/employees', toRequestBody(input))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
  });
}

export function useUpdateEmployeeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: EmployeeInput }) =>
      toFrontend(await api.put<EmployeeResponseDto>(`/employees/${id}`, toRequestBody(input))),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee', variables.id] });
    },
  });
}

export function useUpdateEmployeeStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: Employee['status']; reason?: string }) =>
      toFrontend(
        await api.patch<EmployeeResponseDto>(`/employees/${id}/status`, {
          status: STATUS_TO_BACKEND[status],
          reason,
        })
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee', variables.id] });
    },
  });
}

export interface EmployeeDocumentInput {
  name: string;
  type: EmployeeDocument['type'];
  fileUrl: string;
  size?: string;
  status?: EmployeeDocument['status'];
}

export function useAddEmployeeDocumentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeId, input }: { employeeId: string; input: EmployeeDocumentInput }) =>
      toFrontendDocument(
        await api.post<EmployeeDocumentDto>(`/employees/${employeeId}/documents`, {
          name: input.name,
          type: DOC_TYPE_TO_BACKEND[input.type],
          fileUrl: input.fileUrl,
          sizeLabel: input.size,
          status: input.status ? DOC_STATUS_TO_BACKEND[input.status] : undefined,
        })
      ),
    onSuccess: (_data, variables) => queryClient.invalidateQueries({ queryKey: ['employee', variables.employeeId] }),
  });
}

export function useDeleteEmployeeDocumentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeId, documentId }: { employeeId: string; documentId: string }) =>
      api.delete(`/employees/${employeeId}/documents/${documentId}`),
    onSuccess: (_data, variables) => queryClient.invalidateQueries({ queryKey: ['employee', variables.employeeId] }),
  });
}

export interface EmployeeDailyTaskInput {
  title: string;
  description?: string;
  dueDate: string;
  priority?: EmployeeDailyTask['priority'];
  propertyId?: string;
  roomNumber?: string;
}

export function useAddEmployeeDailyTaskMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeId, input }: { employeeId: string; input: EmployeeDailyTaskInput }) =>
      toFrontendDailyTask(
        await api.post<EmployeeDailyTaskDto>(`/employees/${employeeId}/daily-tasks`, {
          title: input.title,
          description: input.description,
          dueDate: input.dueDate,
          priority: input.priority ? TASK_PRIORITY_TO_BACKEND[input.priority] : undefined,
          propertyId: input.propertyId ? Number(input.propertyId) : undefined,
          roomNumber: input.roomNumber,
        })
      ),
    onSuccess: (_data, variables) => queryClient.invalidateQueries({ queryKey: ['employee', variables.employeeId] }),
  });
}

export interface EmployeeDailyTaskUpdateInput {
  status?: EmployeeDailyTask['status'];
  managerComment?: string;
  rating?: number;
}

export function useUpdateEmployeeDailyTaskMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      employeeId,
      taskId,
      input,
    }: {
      employeeId: string;
      taskId: string;
      input: EmployeeDailyTaskUpdateInput;
    }) =>
      toFrontendDailyTask(
        await api.patch<EmployeeDailyTaskDto>(`/employees/${employeeId}/daily-tasks/${taskId}`, {
          status: input.status ? TASK_STATUS_TO_BACKEND[input.status] : undefined,
          managerComment: input.managerComment,
          rating: input.rating,
        })
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employee', variables.employeeId] });
      queryClient.invalidateQueries({ queryKey: ['employee', 'me'] });
    },
  });
}

export interface EmployeeDamageInput {
  incidentDate: string;
  item: string;
  propertyName?: string;
  roomNumber?: string;
  description?: string;
  estimatedCost?: number;
  deductedFromSalary: boolean;
  deductedAmount?: number;
  photos?: string[];
}

export function useAddEmployeeDamageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeId, input }: { employeeId: string; input: EmployeeDamageInput }) =>
      toFrontendDamage(
        await api.post<EmployeeDamageDto>(`/employees/${employeeId}/damages`, {
          incidentDate: input.incidentDate,
          item: input.item,
          propertyName: input.propertyName,
          roomNumber: input.roomNumber,
          description: input.description,
          estimatedCost: input.estimatedCost,
          deductedFromSalary: input.deductedFromSalary,
          deductedAmount: input.deductedAmount,
          photos: input.photos,
        })
      ),
    onSuccess: (_data, variables) => queryClient.invalidateQueries({ queryKey: ['employee', variables.employeeId] }),
  });
}

export interface EmployeeLeaveInput {
  leaveType: EmployeeLeave['leaveType'];
  startDate: string;
  endDate: string;
  daysCount: number;
  reason?: string;
  status?: EmployeeLeave['status'];
}

export function useAddEmployeeLeaveMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeId, input }: { employeeId: string; input: EmployeeLeaveInput }) =>
      toFrontendLeave(
        await api.post<EmployeeLeaveDto>(`/employees/${employeeId}/leaves`, {
          leaveType: LEAVE_TYPE_TO_BACKEND[input.leaveType],
          startDate: input.startDate,
          endDate: input.endDate,
          daysCount: input.daysCount,
          reason: input.reason,
          status: input.status ? LEAVE_STATUS_TO_BACKEND[input.status] : undefined,
        })
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employee', variables.employeeId] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

export function useUpdateEmployeeLeaveMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      employeeId,
      leaveId,
      status,
    }: {
      employeeId: string;
      leaveId: string;
      status: EmployeeLeave['status'];
    }) =>
      toFrontendLeave(
        await api.patch<EmployeeLeaveDto>(`/employees/${employeeId}/leaves/${leaveId}`, {
          status: LEAVE_STATUS_TO_BACKEND[status],
        })
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employee', variables.employeeId] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}
