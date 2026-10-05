import { useQuery } from '@tanstack/react-query';
import { api } from './client';

export interface OperationsDashboardStats {
  pendingBookings: number;
  occupancyRatePercent: number;
  monthlyRevenue: number;
  overdueBillsCount: number;
  openMaintenanceIssuesCount: number;
}

export interface OwnerDashboardStats {
  totalProperties: number;
  portfolioOccupancyRatePercent: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  netOperatingIncome: number;
}

export interface AdminDashboardStats {
  totalUsers: number;
  usersByRole: Record<string, number>;
  totalProperties: number;
  activityLast24h: number;
}

export interface ClientDashboardStats {
  currentRoomNumber: string;
  currentPropertyName: string;
  monthlyRent: number;
  paymentStatus: string;
  leaseExpiryDate: string;
  openMaintenanceIssuesCount: number;
  unreadNotificationsCount: number;
}

export interface HouseholdDashboardStats {
  todaysTasksCount: number;
  completedThisWeekCount: number;
  averageRating: number | null;
}

export function useOperationsDashboardQuery() {
  return useQuery({
    queryKey: ['dashboard', 'operations'],
    queryFn: () => api.get<OperationsDashboardStats>('/dashboard/operations'),
  });
}

export function useOwnerDashboardQuery() {
  return useQuery({
    queryKey: ['dashboard', 'owner'],
    queryFn: () => api.get<OwnerDashboardStats>('/dashboard/owner'),
  });
}

export function useAdminDashboardQuery() {
  return useQuery({
    queryKey: ['dashboard', 'admin'],
    queryFn: () => api.get<AdminDashboardStats>('/dashboard/admin'),
  });
}

export function useClientDashboardQuery() {
  return useQuery({
    queryKey: ['dashboard', 'client'],
    queryFn: () => api.get<ClientDashboardStats>('/dashboard/client'),
  });
}

export function useHouseholdDashboardStatsQuery() {
  return useQuery({
    queryKey: ['dashboard', 'household'],
    queryFn: () => api.get<HouseholdDashboardStats>('/dashboard/household'),
  });
}
