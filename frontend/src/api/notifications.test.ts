import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { renderHook, waitFor, act } from '@testing-library/react';
import { server } from '../test/mocks/server';
import { withQueryClient } from '../test/test-utils';
import { useMyNotificationsQuery, useMarkAllNotificationsReadMutation } from './notifications';

const BASE = 'http://backend.invalid/api/v1';

describe('Platform domain — notification bell (regression guard for the client-side role-filtering bug)', () => {
  it('loads notifications via /notifications/me (server-scoped) and marks them all read', async () => {
    let markAllCalled = false;
    server.use(
      http.get(`${BASE}/notifications/me`, () =>
        HttpResponse.json({
          content: [
            { id: 9, title: 'Rent overdue', message: 'Invoice INV-0100 is overdue', type: 'PAYMENT', createdAt: '2026-08-17T09:00:00Z', read: false },
          ],
          page: 0,
          size: 50,
          totalElements: 1,
          totalPages: 1,
        })
      ),
      http.patch(`${BASE}/notifications/read-all`, () => {
        markAllCalled = true;
        return new HttpResponse(null, { status: 204 });
      })
    );

    const { result } = renderHook(
      () => ({ list: useMyNotificationsQuery(), markAll: useMarkAllNotificationsReadMutation() }),
      { wrapper: ({ children }) => withQueryClient(children) }
    );

    await waitFor(() => expect(result.current.list.isSuccess).toBe(true));
    expect(result.current.list.data).toEqual([
      expect.objectContaining({ id: '9', type: 'payment', read: false }),
    ]);

    act(() => result.current.markAll.mutate());
    await waitFor(() => expect(result.current.markAll.isSuccess).toBe(true));
    expect(markAllCalled).toBe(true);
  });
});
