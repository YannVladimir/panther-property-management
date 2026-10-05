import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { renderHook, waitFor } from '@testing-library/react';
import { server } from '../test/mocks/server';
import { withQueryClient } from '../test/test-utils';
import { useMyPaymentsQuery } from './payments';

const BASE = 'http://backend.invalid/api/v1';

describe('Finance domain — client self-service payment history', () => {
  it('loads the logged-in client\'s own payments via the server-scoped /payments/me endpoint', async () => {
    server.use(
      http.get(`${BASE}/payments/me`, () =>
        HttpResponse.json({
          content: [
            {
              id: 100,
              invoiceNumber: 'INV-2026-0100',
              clientId: 4,
              clientName: 'Jean-Paul Ndahiro',
              propertyId: 7,
              propertyName: 'Kigali Heights Residence',
              roomId: 12,
              roomNumber: 'A-204',
              amount: 150000,
              date: '2026-08-01',
              type: 'RENT',
              method: 'MOBILE_MONEY',
              status: 'PAID',
            },
          ],
          page: 0,
          size: 100,
          totalElements: 1,
          totalPages: 1,
        })
      )
    );

    const { result } = renderHook(() => useMyPaymentsQuery(), {
      wrapper: ({ children }) => withQueryClient(children),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([
      expect.objectContaining({
        invoiceNumber: 'INV-2026-0100',
        method: 'Mobile Money',
        type: 'rent',
        status: 'paid',
      }),
    ]);
  });
});
