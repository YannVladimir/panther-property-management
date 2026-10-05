import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { renderHook, waitFor, act } from '@testing-library/react';
import { server } from '../test/mocks/server';
import { withQueryClient } from '../test/test-utils';
import { useCreateMaintenanceIssueMutation } from './maintenanceIssues';

const BASE = 'http://backend.invalid/api/v1';

describe('Facilities domain — client reports a maintenance issue', () => {
  it('creates a ticket without sending client identity fields (server resolves the reporter from the JWT)', async () => {
    server.use(
      http.post(`${BASE}/maintenance-issues`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        // Real gap fixed this domain: the old mock call sent clientId/clientName — the real
        // endpoint has no fields for them at all, resolving the reporter from the JWT instead.
        expect(body.clientId).toBeUndefined();
        expect(body.clientName).toBeUndefined();
        return HttpResponse.json({
          id: 55,
          ticketNumber: 'MI-2026-0055',
          clientId: 4,
          clientName: 'Jean-Paul Ndahiro',
          propertyId: body.propertyId,
          propertyName: 'Kigali Heights Residence',
          roomId: body.roomId,
          roomNumber: 'A-204',
          category: body.category,
          title: body.title,
          priority: 'MEDIUM',
          photos: [],
          status: 'SUBMITTED',
          reportedDate: '2026-08-18',
        });
      })
    );

    const { result } = renderHook(() => useCreateMaintenanceIssueMutation(), {
      wrapper: ({ children }) => withQueryClient(children),
    });

    act(() => {
      result.current.mutate({
        propertyId: '7',
        roomId: '12',
        category: 'Plumbing',
        title: 'Leaking tap in bathroom',
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(
      expect.objectContaining({ ticketNumber: 'MI-2026-0055', status: 'Submitted', category: 'Plumbing' })
    );
  });
});
