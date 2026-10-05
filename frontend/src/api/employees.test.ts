import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { renderHook, waitFor } from '@testing-library/react';
import { server } from '../test/mocks/server';
import { withQueryClient } from '../test/test-utils';
import { useMyEmployeeQuery } from './employees';

const BASE = 'http://backend.invalid/api/v1';

describe('HR domain — household self-service employee profile', () => {
  it('resolves "my" employee profile via /employees/me, server-scoped via the JWT (regression guard for the id/email/name-substring guessing bug found 3x this session)', async () => {
    server.use(
      http.get(`${BASE}/employees/me`, () =>
        HttpResponse.json({
          id: 3,
          name: 'Emmanuel Habimana',
          position: 'Lead Facility & Maintenance Officer',
          department: 'MAINTENANCE',
          contact: '0788111222',
          employmentStatus: 'FULL_TIME',
          status: 'ACTIVE',
          startDate: '2023-01-10',
          basicSalary: 250000,
          documents: [],
          dailyTasks: [],
          damages: [],
          leaves: [],
        })
      )
    );

    const { result } = renderHook(() => useMyEmployeeQuery(), {
      wrapper: ({ children }) => withQueryClient(children),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(
      expect.objectContaining({ id: '3', name: 'Emmanuel Habimana', department: 'Maintenance', status: 'active' })
    );
  });
});
