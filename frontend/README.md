# Panther PMS — Frontend

React/TypeScript single-page app for Panther PMS, a property-management platform (booking,
leasing, finance, facilities/maintenance, HR and platform/admin domains) for multi-unit
apartment complexes. Six role-scoped experiences share one codebase: public marketing/booking,
resident (`client`), day-to-day operations, portfolio owner analytics, household/janitorial
checklists, and system admin.

This app talks to the real Spring Boot backend in [`../backend`](../backend) over REST
(`VITE_API_BASE_URL`, default `http://localhost:8080/api/v1`). For the authoritative API
contract, see `../backend/README.md`, `../backend/openapi.json`, and `../backend/docs/ERD.md` —
not `docs/INTEGRATION_SPEC.md` in this folder, which is a historical pre-build planning document
and is stale relative to the live backend (see the disclaimer at the top of that file).

## Tech stack

- **React 19** + **TypeScript**, built with **Vite 8**
- **React Router 7**, **TanStack Query 5** for server state
- **Tailwind CSS 4** for styling, **Recharts** for charts, **lucide-react** icons
- **Vitest** + **Testing Library** + **MSW** (Mock Service Worker) for tests
- **oxlint** for linting

## Prerequisites

- Node.js 20+ and npm
- The backend running (see `../backend/README.md`) if you want real data — the app will build
  and the test suite will pass without it, since tests mock the network boundary with MSW.

## Setup

```bash
npm install
cp .env.example .env   # then edit VITE_API_BASE_URL if your backend isn't on localhost:8080
```

## Running locally

```bash
npm run dev
```

Opens on **http://localhost:5183** (fixed port, see `vite.config.ts`).

## Testing

```bash
npm test
```

Runs the Vitest suite (currently 9 tests across 8 files) with MSW intercepting `fetch` calls at
the network boundary — no real backend required. Tests rely on `.env.test`
(`VITE_API_BASE_URL=http://backend.invalid/api/v1`), which is intentionally committed: it's not a
secret, it just points the client at an unreachable host so a passing test proves MSW actually
intercepted the request rather than silently hitting a real server.

## Linting

```bash
npm run lint
```

Runs `oxlint`. Current warnings are unused imports/variables and a couple of `react-hooks/exhaustive-deps`
hints in some page components — none are build- or correctness-blocking.

## Building

```bash
npm run build
```

Runs `tsc -b` (typecheck) then `vite build`, emitting static assets to `dist/`. Preview the build
with `npm run preview`.

## Project layout

```
src/
  api/          one module per backend resource (properties, bookings, payments, ...),
                each with a thin fetch wrapper around src/api/client.ts
  components/   shared UI (common/, charts/)
  context/      React context providers (auth, app data)
  layouts/      route layout shells per role
  pages/        route-level pages, grouped by role (admin/, client/, household/, operations/, owner/, public/)
  routes/       router configuration
  test/         Vitest setup, MSW handlers/server, shared test utilities
  types/        shared TypeScript types
```

## Environment variables

See `.env.example`. The only variable the app reads is `VITE_API_BASE_URL` — the backend's base
URL (defaults to `http://localhost:8080/api/v1` if unset).
