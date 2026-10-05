import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { renderHook, waitFor } from '@testing-library/react';
import { server } from '../test/mocks/server';
import { withQueryClient } from '../test/test-utils';
import { usePropertiesQuery } from './properties';

const BASE = 'http://backend.invalid/api/v1';

describe('Property domain — public property list', () => {
  it('loads real ACTIVE properties and maps backend fields into the frontend Property shape', async () => {
    server.use(
      http.get(`${BASE}/properties`, ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('status')).toBe('ACTIVE');
        return HttpResponse.json({
          content: [
            {
              id: 7,
              name: 'Kigali Heights Residence',
              code: 'PROP-007',
              location: 'Kigali',
              images: [],
              amenities: ['WiFi'],
              rating: 4.5,
              reviewCount: 12,
              featured: true,
              monthlyRevenueEstimate: 500000,
              status: 'ACTIVE',
              totalRooms: 10,
              occupiedRooms: 6,
              availableRooms: 4,
              reservedRooms: 0,
              maintenanceRooms: 0,
            },
          ],
          page: 0,
          size: 100,
          totalElements: 1,
          totalPages: 1,
        });
      })
    );

    const { result } = renderHook(() => usePropertiesQuery({ status: 'active' }), {
      wrapper: ({ children }) => withQueryClient(children),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([
      expect.objectContaining({
        id: '7',
        name: 'Kigali Heights Residence',
        status: 'active',
        occupiedRooms: 6,
      }),
    ]);
  });
});
