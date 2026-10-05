import { http, HttpResponse } from 'msw';

/** Matches .env.test's VITE_API_BASE_URL — a deliberately unreachable host, so a passing test
 * proves MSW intercepted the request rather than accidentally hitting a real backend. */
const BASE = 'http://backend.invalid/api/v1';

/** Baseline handlers shared across test files; individual tests override with `server.use(...)`
 * for the specific request/response shape under test. */
export const handlers = [
  http.post(`${BASE}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };
    if (body.password !== 'password@123') {
      return HttpResponse.json({ status: 401, message: 'Invalid credentials' }, { status: 401 });
    }
    return HttpResponse.json({
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
      user: {
        id: 1,
        name: 'Operations Manager',
        email: body.email,
        role: 'OPERATIONS',
        status: 'ACTIVE',
        mustChangePassword: false,
      },
    });
  }),
];
