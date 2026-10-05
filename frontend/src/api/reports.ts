import { useQuery } from '@tanstack/react-query';
import { api } from './client';

export interface RevenueExpensePoint {
  month: string;
  revenue: number;
  expenses: number;
}

export interface OccupancyPoint {
  propertyId: string;
  propertyName: string;
  totalRooms: number;
  occupiedRooms: number;
  occupancyRatePercent: number;
}

export interface PropertyPerformancePoint {
  propertyId: string;
  propertyName: string;
  monthlyRevenue: number;
  occupancyRatePercent: number;
}

interface OccupancyPointDto {
  propertyId: number;
  propertyName: string;
  totalRooms: number;
  occupiedRooms: number;
  occupancyRatePercent: number;
}

interface PropertyPerformancePointDto {
  propertyId: number;
  propertyName: string;
  monthlyRevenue: number;
  occupancyRatePercent: number;
}

export function useRevenueExpenseReportQuery(months = 8) {
  return useQuery({
    queryKey: ['reports', 'revenue-expense', months],
    queryFn: () => api.get<RevenueExpensePoint[]>('/reports/revenue-expense', { months }),
  });
}

export function useOccupancyReportQuery() {
  return useQuery({
    queryKey: ['reports', 'occupancy'],
    queryFn: async () => {
      const points = await api.get<OccupancyPointDto[]>('/reports/occupancy');
      return points.map((p): OccupancyPoint => ({ ...p, propertyId: String(p.propertyId) }));
    },
  });
}

export function usePropertyPerformanceReportQuery() {
  return useQuery({
    queryKey: ['reports', 'property-performance'],
    queryFn: async () => {
      const points = await api.get<PropertyPerformancePointDto[]>('/reports/property-performance');
      return points.map((p): PropertyPerformancePoint => ({ ...p, propertyId: String(p.propertyId) }));
    },
  });
}
