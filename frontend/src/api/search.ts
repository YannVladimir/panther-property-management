import { useQuery } from '@tanstack/react-query';
import { api } from './client';

export interface SearchResultItem {
  category: 'PROPERTY' | 'CLIENT' | 'BOOKING' | 'EMPLOYEE' | 'TECHNICIAN';
  id: string;
  title: string;
  subtitle: string;
}

interface SearchResultItemDto {
  category: string;
  id: number;
  title: string;
  subtitle: string;
}

/**
 * Real global search only — hits GET /api/v1/search, restricted server-side to
 * OPERATIONS/ADMIN/OWNER. It fans out across properties/clients/bookings/employees/technicians
 * only (confirmed against SearchService.java) — it does NOT cover rooms or payments, unlike the
 * old mock modal. That's a genuine backend capability gap, not a frontend bug — flagged, not
 * silently patched over with a fake local search over stale data.
 */
export function useGlobalSearchQuery(query: string) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: ['search', trimmed],
    queryFn: async () => {
      const results = await api.get<SearchResultItemDto[]>('/search', { q: trimmed });
      return results.map((r): SearchResultItem => ({ ...r, id: String(r.id) } as SearchResultItem));
    },
    enabled: trimmed.length > 0,
  });
}
