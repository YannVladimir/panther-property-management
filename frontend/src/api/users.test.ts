import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { renderHook, waitFor, act } from '@testing-library/react';
import { server } from '../test/mocks/server';
import { withQueryClient } from '../test/test-utils';
import { useUpdateUserStatusMutation } from './users';

const BASE = 'http://backend.invalid/api/v1';

describe('IAM/admin domain — account status change (regression guard)', () => {
  it('fires the dedicated PATCH /users/:id/status endpoint rather than a plain field update', async () => {
    server.use(
      http.patch(`${BASE}/users/9/status`, async ({ request }) => {
        const body = (await request.json()) as { status: string };
        expect(body.status).toBe('SUSPENDED');
        return HttpResponse.json({
          id: 9,
          name: 'Jean-Paul Ndahiro',
          email: 'jp.ndahiro@gmail.com',
          role: 'CLIENT',
          status: 'SUSPENDED',
          mustChangePassword: false,
          createdAt: '2025-01-01T00:00:00Z',
        });
      })
    );

    const { result } = renderHook(() => useUpdateUserStatusMutation(), {
      wrapper: ({ children }) => withQueryClient(children),
    });

    act(() => result.current.mutate({ id: '9', status: 'suspended' }));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(expect.objectContaining({ status: 'suspended' }));
  });
});
