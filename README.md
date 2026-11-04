# Panther PMS — Property Management System

A full-stack property-management platform for multi-unit apartment complexes/estates: public
marketing & booking, resident (tenant) self-service, day-to-day operations (CRM, leasing, water
sub-metering, recurring bills, technician dispatch, HR), owner portfolio analytics, a household/
janitorial checklist interface, and system administration.

This is a monorepo with two independently deployable parts:

| Folder | Stack | What it is |
|---|---|---|
| [`backend/`](backend) | Java 21, Spring Boot 3, PostgreSQL, Flyway | REST API — auth/JWT, all domain logic, persistence |
| [`frontend/`](frontend) | React 19, TypeScript, Vite, Tailwind CSS | Single-page app, role-scoped UI for all six roles |

Each has its own README with full setup/run/test instructions — see
[`backend/README.md`](backend/README.md) and [`frontend/README.md`](frontend/README.md).

## Quick start

```bash
# 1. Backend + Postgres, via Docker
cd backend
docker compose up -d
# API on http://localhost:8080, Swagger UI on http://localhost:8080/swagger-ui.html

# 2. Frontend, in a second terminal
cd frontend
npm install
cp .env.example .env
npm run dev
# App on http://localhost:5183
```

Default seeded login: `admin@panther.rw` / `ChangeMe123!` (forced password change on first login;
see `backend/README.md` for how to override via environment variables).

## Testing

```bash
# Backend — unit tests (surefire) + integration tests (failsafe, via Testcontainers; needs Docker running)
cd backend && mvn verify

# Frontend — Vitest + MSW, no backend/Docker required
cd frontend && npm test
```

Both suites are wired into CI — see [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

## Documentation

- API contract: `backend/openapi.json` (import into Postman/Insomnia, or browse live Swagger UI),
  and `backend/docs/ERD.md` for the entity relationship diagram.
- Build history / architecture rationale: `backend/BACKEND_PLAN.md`,
  `FRONTEND_INTEGRATION_PLAN.md`, `DATA_MIGRATION_PLAN.md` — these are living build logs kept for
  the design decisions and real bugs they document, not aspirational specs. (The one aspirational,
  pre-implementation spec — `frontend/docs/INTEGRATION_SPEC.md` — is explicitly marked historical
  and superseded by the real backend contract above; don't treat its schema/routes as current.)
- Pre-production checklist: `backend/PRODUCTION_CHECKLIST.md`.

## License

[MIT](LICENSE) © 2026 Yann Vladimir Bajeneza
