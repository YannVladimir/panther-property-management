import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

interface SystemSettingsDto {
  companyName: string;
  currencyCode: string;
  waterRatePerM3: number;
  defaultAgentCommissionPct: number;
  vatTaxRatePct: number;
}

export interface SystemSettings {
  companyName: string;
  currencyCode: string;
  waterRatePerM3: number;
  defaultAgentCommissionPct: number;
  vatTaxRatePct: number;
}

/** GET is OPERATIONS/OWNER/ADMIN; PUT is ADMIN-only — enforced server-side, not just hidden in the UI. */
export function useSystemSettingsQuery() {
  return useQuery({
    queryKey: ['systemSettings'],
    queryFn: async () => api.get<SystemSettingsDto>('/settings'),
  });
}

export function useUpdateSystemSettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SystemSettings) => api.put<SystemSettingsDto>('/settings', input),
    onSuccess: (data) => queryClient.setQueryData(['systemSettings'], data),
  });
}
