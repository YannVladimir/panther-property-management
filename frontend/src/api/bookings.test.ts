import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { renderHook, waitFor, act } from '@testing-library/react';
import { server } from '../test/mocks/server';
import { withQueryClient } from '../test/test-utils';
import { useCreateBookingMutation } from './bookings';

const BASE = 'http://backend.invalid/api/v1';

describe('Leasing/CRM domain — public booking inquiry (core flow from the plan)', () => {
  it('submits an anonymous booking inquiry and returns a confirmed booking number', async () => {
    server.use(
      http.post(`${BASE}/bookings`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        expect(body.clientId).toBeUndefined();
        expect(body.source).toBe('CLIENT_PORTAL');
        return HttpResponse.json({
          id: 42,
          bookingNumber: 'BK-2026-0042',
          clientName: body.clientName,
          clientEmail: body.clientEmail,
          clientPhone: body.clientPhone,
          propertyId: body.propertyId,
          propertyName: 'Kigali Heights Residence',
          rentalTypeId: body.rentalTypeId,
          rentalTypeName: 'Monthly',
          requestedDate: '2026-08-18',
          moveInDate: body.moveInDate,
          monthlyRent: body.monthlyRent,
          deposit: body.deposit ?? 0,
          status: 'REQUESTED',
          source: 'CLIENT_PORTAL',
          timeline: [{ status: 'REQUESTED', occurredAt: '2026-08-18T10:00:00Z', updatedByName: 'System' }],
        });
      })
    );

    const { result } = renderHook(() => useCreateBookingMutation(), {
      wrapper: ({ children }) => withQueryClient(children),
    });

    act(() => {
      result.current.mutate({
        clientName: 'Jean-Paul Ndahiro',
        clientEmail: 'jp.ndahiro@gmail.com',
        clientPhone: '0788000000',
        propertyId: '7',
        rentalTypeId: '2',
        moveInDate: '2026-09-01',
        monthlyRent: 150000,
        source: 'client_portal',
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(
      expect.objectContaining({
        bookingNumber: 'BK-2026-0042',
        status: 'requested',
        clientId: undefined,
      })
    );
  });
});
