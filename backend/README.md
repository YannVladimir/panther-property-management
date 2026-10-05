# Panther PMS Backend

Java Spring Boot backend for Panther PMS. See **`BACKEND_PLAN.md`** (or `backend-plan.html`) for the full architecture, database schema, and API catalog this implementation follows.

**Confirmed stack decisions:** PostgreSQL, Maven, JWT returned in the JSON response body, local-disk file storage for now.

## Status

- ✅ **Phase 0 — Bootstrap**: Maven project, package skeleton, Docker Compose, Flyway, springdoc-openapi, global exception handling.
- ✅ **Phase 1 — IAM & Security (core slice)**: `users`, `system_settings`, `notification_preferences` tables; JWT login/refresh/logout/me/change-password/forgot-password/reset-password; admin user CRUD + status/reset/resend-invite; system settings GET/PUT; per-user notification preferences.
- ✅ **Phase 2 — Property domain**: `properties`, `buildings`, `rooms`, `rental_types` (+ images/amenities/utilities/rules/included-materials child tables) with full CRUD; occupancy counts computed via a grouped query (not N+1); public unauthenticated browsing with visibility rules (non-`ACTIVE` properties are invisible to anonymous callers); guard rails against deleting a property/building that still has rooms and against a room's building not belonging to its property.
- ✅ **Phase 3 — Leasing & CRM**: `clients` (+ materials/documents), `bookings` (+ timeline), `agents` (+ deals) with full CRUD; the booking state machine's side effects are server-enforced (assign-room → room reserved; check-in → room occupied + client's room set; move-out → room available + client marked former); agent commission totals are computed at read time (no drifting counters); public unauthenticated booking inquiries; row-level scoping so a CLIENT-role login only ever sees its own client/booking records. Two real bugs found via live testing were fixed along the way — see `BACKEND_PLAN.md` section 10 for details (a missing `users.clientId`/`employeeId` linkage, and a JPA merge-vs-persist id-population bug).
- ✅ **Phase 4 — Finance**: `payments`, `expenses`, `recurring_bills` (+ `bill_payments`), `payroll_records` with full CRUD; recording a `RENT`/`PAID` payment flips the client's payment status (verified live); bill payments flip the parent bill to `PAID`; payroll's `netSalary` is computed server-side, never trusted from client input; client/household self-service (`/payments/me`, `/payroll-records/me`) and owner read-only access all verified live.
- ✅ **Phase 5 — Facilities & Maintenance**: `technicians` (+ certifications/documents/work orders), `preventive_tasks`, `damage_reports`, `water_meters` (+ readings history), `maintenance_issues` with full CRUD. Technician `totalJobs`/`totalPaid` and work-order `totalCost` are all computed, not stored. Water meter billing math verified exact live, including a billing-cycle rollover that correctly snapshots history and a payment that creates a linked `UTILITY` payment in the finance ledger (facilities → finance, one-directional). The household preventive-task self-service needed a real fix — see `BACKEND_PLAN.md` section 10 for the `PreventiveTaskAccessGuard` pre-authorization bug/fix.
- ✅ **Phase 6 — HR**: `employees` (+ documents/daily-tasks/damages/leaves) with full CRUD. Leave approval/completion correctly drives `employees.status` between `ACTIVE`/`ON_LEAVE`, verified live in all three states. Household self-service (`/employees/me`, `.../daily-tasks`, `.../history`) and scoped `/employees/{id}/**` access both verified live, including confirming another employee's data is blocked (403), not just hidden. This phase also retrofitted real (if `NOT VALID`, i.e. not retroactively checked) FK constraints from `payroll_records.employee_id` and `preventive_tasks.assigned_staff_id` onto the new `employees` table — those two loose ends from Phases 4 and 5 are now closed.
- ✅ **Phase 7 — Platform**: audit trail (`AuditService`, wired into ~25 mutation points across all 6 domains — verified live with a correctly-attributed real entry), notifications (broadcast + per-user read state, verified live including correct role-targeting), all 5 role dashboards (verified live, owner NOI computed exactly), 3 report endpoints, and global search. One real architectural fix along the way: the audit-log write path was relocated from `platform` to `common.audit` to avoid a circular package dependency — see `BACKEND_PLAN.md` section 3 for why. CSV/PDF export and a dedicated water-consumption report are explicitly deferred.
- ✅ **Phase 8 — Hardening & Handover**: automated test suite (JUnit 5 + Testcontainers + MockMvc,
  148 tests, `mvn verify`) covering the full permission matrix, auth flows, the booking lifecycle,
  water-meter billing math, and HR leave-status sync; per-IP rate limiting on `/auth/login` and the
  anonymous booking inquiry; OpenAPI spec exported to `openapi.json`; ERD (`docs/ERD.md`); and
  `PRODUCTION_CHECKLIST.md`. Two real bugs found and fixed while building the suite — a
  Testcontainers/Spring-context-cache interaction bug, and an anonymous `/auth/me` request 500ing
  instead of returning 401/403 — see `BACKEND_PLAN.md` section 10 for both. Load-testing and the
  frontend integration itself remain explicitly deferred (see `PRODUCTION_CHECKLIST.md`).
- Bonus: `POST /api/v1/files/upload` (generic file upload, local disk) is already implemented since every later domain's photo/document fields depend on it.

Every phase so far has been compiled, packaged, and smoke-tested live against a real Postgres instance (not just written) — see the specific checks called out in `BACKEND_PLAN.md` section 10.

## Running locally

### Option A — everything in Docker

```bash
docker compose up -d
```

This starts Postgres and the API together. The API will be on **http://localhost:8080** unless that port is already taken on your machine (see note below).

### Option B — Postgres in Docker, app on host (faster edit-compile loop)

```bash
docker compose up -d db
mvn spring-boot:run
```

By default this expects Postgres on `localhost:5432`. **If port 5432 or 8080 is already used by something else on your machine** (common on shared dev boxes), override via env vars:

```bash
DB_PORT=55432 SERVER_PORT=8091 mvn spring-boot:run
```

(and change `docker-compose.yml`'s db port mapping to match if you go that route — it currently maps host `55432` → container `5432` for exactly this reason).

### Default seeded account

On first boot (empty `users` table), a default admin is seeded from config:

| Env var | Default |
|---|---|
| `PANTHER_ADMIN_EMAIL` | `admin@panther.rw` |
| `PANTHER_ADMIN_PASSWORD` | `ChangeMe123!` |

`mustChangePassword` is `true` for this account — build the frontend's first-login flow to respect that flag. Set `PANTHER_SEED_ENABLED=false` to disable seeding entirely (it's off by default in the `prod` profile).

**Change `PANTHER_JWT_SECRET` in every real environment** — the value in `application.yml` is a dev-only placeholder.

## Running the test suite

```bash
mvn verify
```

`mvn verify` runs both the plain unit tests (surefire) and the `*IT.java` integration tests
(failsafe, via Testcontainers — requires Docker running locally). `mvn test` alone only runs the
unit tests, by Maven's standard naming convention (`*IT.java` is deliberately excluded from
surefire's default include pattern).

## API docs

Once running: `http://localhost:<port>/swagger-ui.html`

A static export of the OpenAPI spec (fetched from a running instance) is checked in at
`openapi.json` — import it directly into Postman/Insomnia (both support native OpenAPI import)
rather than maintaining a hand-authored collection alongside it. See also `docs/ERD.md` for the
entity relationship diagram, and `PRODUCTION_CHECKLIST.md` before any real deployment.

## Quick manual test

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@panther.rw","password":"ChangeMe123!"}'
```

Copy the `accessToken` from the response and use it as `Authorization: Bearer <token>` on any other endpoint.

## Project layout

Package-by-domain under `com.panther.pms`: `iam`, `property`, `leasing`, `finance`, `facilities`, `hr`, `platform`, plus `common` (shared base entity, error handling, file storage) and `config`/`security` (JWT, CORS, OpenAPI). Full rationale in `BACKEND_PLAN.md` section 3.

## Next steps (see `BACKEND_PLAN.md` section 10 for the full checklist)

All 7 functional domains and Phase 8 hardening are now implemented. What remains, all explicitly
deferred (see `PRODUCTION_CHECKLIST.md`): load-testing the high-volume list endpoints with a real
tool (k6/Gatling), a CI pipeline skeleton (Phase 0), broader automated test coverage beyond the 5
codified flows (property/room CRUD, finance CRUD beyond water-meter billing, technician/work-order
cost rollup, audit trail attribution, notification targeting — all still manual-live-verified only),
CSV/PDF report export, and the scheduled jobs for bill/leave auto-reversion. The actual frontend
integration (replacing `DataContext`'s mock state with a real API client) is a separate frontend-side
task and can start in parallel with any of the above.
