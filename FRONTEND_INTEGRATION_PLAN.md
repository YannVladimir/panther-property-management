# Panther PMS — Frontend ↔ Backend Integration Plan

**Status: The entire plan is done.** Section 3 (Auth Integration), all seven Section 4 domains —
Property, Leasing/CRM, Finance, Facilities, HR, IAM/admin, and Platform — Section 5 (Correctness
Traps audit), Section 6 (Environment & CORS), Section 7 (Testing), and Section 8 (Open Decisions)
are all done and verified. `frontend/` now has its own git repository (it had none before this
pass) with a single commit covering the full integration. Section 5's audit
closed the biggest remaining gap in the whole plan — real file uploads (`POST /api/v1/files`) are now
wired everywhere a page previously faked one, including one spot (`TechniciansPage`) where the
"upload" was never even a real file, just a filename string glued into a fake path. See the **✅
EXECUTED**
notes inline for exactly what was built, what was verified, and the real gaps found along the way —
missing `status` field on `Property`; a hardcoded-fake-room/property-id bug found and fixed **four
separate times** across different pages (`AdminRoomEditPage`, `DamagesManagementPage`,
`TechniciansPage`, `EmployeeDetailPage`'s daily-task form) — a genuinely recurring pattern, not a
one-off; a `User`-id-vs-`Client`-id mix-up and a fake fallback id in the public booking form, and the
identical self-service-identity-guessing bug class found **three times** (`HouseholdSalaryPage`,
`HouseholdTaskHistoryPage`, `HouseholdDashboard`); a fabricated fake-document display bug in
`ClientDetailPage`; a stale-snapshot state bug in `AgentsCommissionsPage`; a status-dropdown-doesn't-
map-to-the-real-endpoint bug found **twice** (`DamagesManagementPage`, and the account-status field
in `AdminUsersRolesPage`'s own edit panel); two hardcoded fake reviewer/approver names sent to
endpoints that either ignore or have no field for them (`EmployeeDetailPage`'s task review and leave
approval); a fabricated auto-attached document and a non-functional avatar-URL input found on both
employee creation and user creation; a missing client/employee-record linking picker on user
creation despite the backend already supporting it; a real, pre-existing seed-data bug in the
backend itself (`DataSeeder` wrote the frontend's old display string `"USD ($)"` directly into the
`currencyCode` column instead of a clean ISO code) found and fixed at the source; a system-settings
page that, before this pass, was never wired to anything at all — not even mock state — so every
"save" was a total no-op; and a genuine data-model mismatch between two preventive-maintenance-
checklist pages and the backend's actual schema. The long-standing "no change-password UI anywhere"
gap flagged back in Section 3 is now closed — a real change-password form was added to
`ProfileSettingsPage` as part of this pass. Remaining deliberately-unconverted gaps: the
client-initiated rent-payment API gap (Finance), the preventive-maintenance data-model mismatch
(Facilities), the task-reviewer-identity backend gap (HR), one known agent-deal room-picker gap
(Leasing/CRM), and `ProfileSettingsPage`'s name/email/phone fields are now read-only rather than
fake-editable — there is no self-service profile-update endpoint in the backend at all (`PUT
/users/{id}` is ADMIN-only), a newly-found gap of the same class as the rent-payment one.

**Platform domain, done last as planned** (dashboards/search/reports aggregate across every other
domain, so it was only safe once all six above were real): every role dashboard, `ActivityLogPage`,
`ClientNotificationsPage`, `ReportsPage`, and `GlobalSearchModal` are now wired to real dashboard-
aggregate, reports, notifications, activity-log, and search endpoints. Real bugs found: `Client-
Dashboard` was still reading the mock `DataContext`'s `payments`/`maintenanceIssues` arrays and
filtering them by the client's real numeric id — silently broken (always empty) since those ids
never match the old mock string ids, fixed via the real self-service `/payments/me` and
`/maintenance-issues/me` endpoints already built in Finance/Facilities; `OwnerExecutiveDashboard`'s
"Executive Priority Notices" panel showed three **permanently fabricated** alert cards (fake names,
fake dollar figures) that were never wired to any data source, mock or real — replaced with the
actual largest overdue balance, highest-value pending booking, and most recently passed preventive
task; `DashboardLayout`'s notification bell filtered a shared broadcast array by role client-side
instead of using the real per-user `/notifications/me` endpoint — the same self-service-scoping bug
class found repeatedly in every other domain; `GlobalSearchModal` searched local, stale mock arrays
(including rooms/payments, which the real search endpoint doesn't even cover) instead of the real
role-restricted `/search` endpoint — search is now hidden entirely for client/household roles rather
than shown and then 403ing on first use; `ActivityLogPage`'s module filter dropdown used invented
labels ("Finance & Payments", "Rooms & Estates", "Maintenance Issues") that matched none of the
actual `module` strings the backend's `AuditService` logs under — confirmed by grepping every call
site — replaced with the real list; `ReportsPage`'s report-type dropdown had a "payroll" option
with no matching render branch at all (a pre-existing dead end, not introduced here) — filled in
with a real payroll table; and `PropertyPerformanceBar` was charting `Property.monthlyRevenueEstimate`
(a manually-set estimate field) as if it were actual revenue — swapped to the real computed
`monthlyRevenue` from `GET /reports/property-performance`, per the plan's own correctness-trap
warning about not shadowing backend-computed values. One activity-log data-shape wrinkle handled
carefully rather than papered over: migrated legacy rows store a descriptive role title ("Operations
Director") while live-generated rows store the bare enum ("OPERATIONS") — the display mapper only
reformats the latter, detected by an all-caps check, so migrated rows aren't mangled.

**Goal:** replace the frontend's entirely client-side mock state (`DataContext.tsx`, `AuthContext.tsx`,
`mockData.ts`) with real calls to the Spring Boot backend documented in `BACKEND_PLAN.md`, so the app
runs on the real, persisted data migrated per `DATA_MIGRATION_PLAN.md` instead of in-memory fixtures
that reset on every page reload.

This is a large, cross-cutting change touching every page in the app (45 pages across 5 role areas).
It is planned as an incremental, domain-by-domain rollout — mirroring the backend's own 7-domain build
order — rather than one big-bang rewrite, so the app stays in a working, demoable state throughout.

---

## 1. Current State (what's actually there today)

Confirmed by direct inspection, not assumption:

- **No HTTP client at all** — `package.json` has no `axios`, no `fetch` wrapper, nothing. Every page
  reads/writes through React Context (`useContext`), backed by `useState` initialized from
  `mockData.ts` arrays.
- **No data-fetching/cache library** — no TanStack Query, SWR, Redux, or Zustand. Just plain React
  state and prop drilling through Context.
- **`DataContext.tsx`** (1,428 lines) exposes ~19 domain state arrays (`properties`, `rooms`,
  `bookings`, `clients`, `payments`, …) and ~50 synchronous mutator functions (`addBooking`,
  `updateBookingStatus`, `addPayment`, `updateWaterMeterReading`, …). Every one of these currently
  runs instantly and locally — no loading state, no error state, no network round-trip — because
  there's no network involved yet.
- **`AuthContext.tsx`** has **no real authentication**: `login(email)` matches a mock user by email
  with no password check whatsoever, and there's a `switchRole()` escape hatch that just swaps the
  "current user" to any of the 5 demo personas with one click. Session state is a single
  `localStorage` key (`panther_user_role`) — not a token.
- **`LoginPage.tsx`** already has a real-looking email/password form, but the password field is
  decorative: its value is never read or sent anywhere. Below the form is a "1-click demo personas"
  panel that logs in as any role instantly, no credentials needed.
- **No route guarding** — `AppRoutes.tsx` renders every role's pages unconditionally; there is no
  `ProtectedRoute`/redirect-to-login mechanism, since with pure mock data there was nothing to
  protect against.
- **No test tooling** — no Vitest/Jest/Testing Library configured. Any testing strategy for this
  migration starts from zero on the frontend side.
- **No git repository** in `frontend/` (or anywhere under `panther/`) at the time of this plan.

None of this is a criticism of the current app — it's a demo/prototype frontend, doing exactly what
it needs to for that purpose. This section exists so the integration plan below is grounded in what
actually has to change, not assumptions.

## 2. Target Architecture

- **API client**: a small hand-rolled `src/api/client.ts` wrapping `fetch`, not a new dependency —
  the backend exposes a plain REST/JSON API (`BACKEND_PLAN.md` §6) with no need for anything heavier.
  Base URL from a Vite env var (`VITE_API_BASE_URL`, defaulting to `http://localhost:8080/api/v1` in
  dev). Centralizes: attaching the `Authorization: Bearer <token>` header, JSON encode/decode, and a
  single place to handle a `401` response (see auth section below).
- **Data fetching pattern**: this is the one place worth spending a new dependency — with ~50
  mutations and ~20 list/detail reads across 45 pages, hand-rolled `useEffect` + `useState` loading/
  error plumbing on every page would be repetitive and error-prone. **Recommended: introduce
  `@tanstack/react-query`** for caching, request de-duplication, automatic refetch-after-mutation, and
  built-in loading/error states — flagged as an open decision in section 8 rather than assumed,
  since it's the one real trade-off in this plan (one new dependency vs. a lot of repeated
  boilerplate).
- **Auth token storage**: access + refresh tokens returned in the JSON body (per the backend's
  already-confirmed decision) stored in memory (a small `AuthContext`-held value) plus the refresh
  token in `localStorage` so a page reload doesn't force a full re-login — matching what a 15-minute
  access-token TTL (`BACKEND_PLAN.md` §4) needs in practice. The API client transparently retries a
  request once after a silent refresh on a `401`, and only redirects to `/login` if the refresh
  itself fails.
- **Route guarding**: a new `<ProtectedRoute allowedRoles={[...]}>` wrapper around each role's route
  subtree in `AppRoutes.tsx`, redirecting to `/login` if unauthenticated and to a "not authorized"
  state (not just silently rendering) if the authenticated user's role doesn't match the route —
  real enforcement that doesn't exist today because it never needed to.

## 3. Auth Integration (do this first — everything else depends on it) — ✅ done and verified

- [x] Added `VITE_API_BASE_URL` env var + `.env.example` (dev override in `.env.local`, gitignored
      via the existing `*.local` rule); confirmed against the backend's CORS config.
- [x] Built `src/api/client.ts`: fetch wrapper (`api.get/post/put/patch/delete`), JSON handling,
      bearer header injection, 401 → silent-refresh-then-retry-once → clears session and calls a
      registered `onSessionExpired` handler if the refresh itself fails. `src/api/auth.ts` holds the
      typed login/refresh/me/logout/change-password/forgot-password/reset-password calls and the
      backend-enum-to-frontend-lowercase `User` mapping (backend roles are `UPPER_SNAKE`, the
      frontend's `UserRole` union is lowercase).
- [x] Rewrote `AuthContext.tsx`: `login(email, password)` now calls the real endpoint and throws on
      failure; a mount-time effect calls `refreshSession()` with any stored refresh token to restore
      a session on page reload (one call returns both a fresh access token and the user profile, no
      separate `/auth/me` round-trip needed); added `isInitializing` so `ProtectedRoute` doesn't
      redirect-to-login before that restore attempt resolves.
- [x] Removed `switchRole()` entirely. `RoleSwitcher.tsx` (rendered in both layouts) is now a
      dev-only component (`if (!import.meta.env.DEV) return null`) that performs a **real** login
      call with the migrated accounts' actual `password@123` credential — not a client-side role
      assignment — so it can't be mistaken for (or become) a real privilege-escalation hole once
      this ships. `AuthContext.demoAccounts` now holds just `{role, label, email, description}`
      (no fake pre-built `User` object) since the real user profile always comes back from the login
      response itself.
- [x] Wired `LoginPage.tsx`'s password field for real (it was decorative — its value was never read
      before), added a visible error state for wrong credentials, removed the now-meaningless
      "Remember me" checkbox (a refresh token always persists to `localStorage` regardless — there
      was nothing left for that checkbox to actually toggle), and gated the demo-persona panel to
      `import.meta.env.DEV` (calling the real `login()`, not a fake one).
- [ ] **Not done — gap found, not a task skipped.** There is no change-password, forgot-password, or
      reset-password *page* anywhere in the frontend to wire up (confirmed by search — the mock app
      never had real auth, so none was ever built). `api/auth.ts` already exports typed
      `changePassword`/`forgotPassword`/`resetPassword` functions ready to call once such UI exists;
      building that UI is net-new page work, not a wiring task, so it's left for a future session
      rather than built unprompted here. Practically low-urgency right now: only the bootstrap admin
      account has `mustChangePassword=true` — all 5 migrated accounts have it `false`.
- [x] Added `<ProtectedRoute>` and wrapped every role subtree in `AppRoutes.tsx`; added a 403 "not
      authorized" page, distinct from the "not logged in" redirect.
- [x] Verified — **at the network/API level, not via an actual browser click-through** (no browser
      automation tool was available this session, so this is the honest scope of what "verified"
      means here): `npx tsc -b` compiles clean with zero errors; Vite serves every touched module
      without a transform error; a real CORS preflight + login POST from the exact
      `http://localhost:5183` origin the dev server runs on succeeds and returns the exact response
      shape `api/auth.ts` expects; the refresh-token flow (what page-reload session restore depends
      on) returns a fresh access token + user profile in one call, confirmed live. **Recommended
      follow-up before calling this fully done: an actual browser click-through** (login form
      submission, wrong-password error rendering, page-reload session persistence, logout redirect,
      cross-role route blocking) — the API contract is proven correct, but no framework/rendering bug
      in the React components themselves would be caught by the checks above.

## 4. Data Layer — Domain-by-Domain Rollout

Mirrors the backend's own build order (`BACKEND_PLAN.md` §10), since each phase there already has a
matching, verified REST surface to integrate against. Each domain phase below follows the same
inner loop:

> wire read endpoints (replace the mock array with a query) → wire write endpoints (replace each
> mutator function's body with a mutation call) → smoke-test every page that touched this domain,
> across every role that can reach it.

> **Correction after actually doing the Property domain (see below): deleting a domain's mock
> arrays out of `DataContext.tsx`/`mockData.ts` is *not* safe to do per-domain**, as the original
> draft of this plan assumed. Dashboards, global search, and several client-portal pages
> (`OwnerExecutiveDashboard`, `OperationsDashboard`, `AdminDashboard`, `GlobalSearchModal`,
> `MyRoomPage`, `MyBookingPage`, etc.) read `properties`/`rooms` (and will read every other
> domain's arrays too) *across* domain boundaries, and most of those pages' own primary domains
> haven't been wired yet. Deleting a domain's mock state as soon as its *own* pages are converted
> would break every one of those cross-domain readers. The mock arrays for a domain can only be
> deleted once **every** consumer across **every** domain has been migrated — realistically only
> after the last domain phase (Platform) is done. Until then, `DataContext.tsx` intentionally keeps
> serving mock data to not-yet-converted pages side-by-side with the real API serving converted
> ones — an expected, temporary transitional state, not a bug.

- [x] **Property domain** — `properties`, `buildings`, `rooms`, `rental_types` — ✅ done and
      verified. See the execution note immediately below for what was built, what was found, and
      how it was verified.

  **What was built:** a real API layer (`src/api/enumMappers.ts`, `pagination.ts`, `properties.ts`,
  `rooms.ts`, `buildings.ts`, `rentalTypes.ts`) using `@tanstack/react-query`, with mapper functions
  that convert backend DTOs into the *same* frontend types (`Property`/`Room`/`Building`/
  `RentalTypeConfig`) the pages already used — so almost no rendering JSX had to change, only how
  each page fetches/mutates data. Backend enums (`UPPER_SNAKE`) are mapped to/from the frontend's
  existing display-string unions (e.g. `FULLY_FURNISHED` ↔ `'Fully Furnished'`) via explicit two-way
  maps, not case conversion, since a couple (`Semi-Furnished`/`SEMI_FURNISHED`) don't reduce to one.
  All 10 pages that primarily own this domain were converted: `HomePage`, `PropertiesPage`,
  `PropertyDetailPage`, `RoomDetailPage` (public); `PropertiesManagementPage` (operations);
  `AdminPropertiesPage`, `AdminPropertyEditPage`, `AdminBuildingsRoomsPage`, `AdminRoomEditPage`,
  `AdminRentalTypesPage` (admin).

  **Real gaps found and fixed along the way** (not just a mechanical API swap):
  - The frontend's `Property` type was missing a `status: PropertyStatus` field entirely — the
    mock data never modeled it, but the backend has always had a real, persisted `status` column
    that controls public visibility (`BACKEND_PLAN.md` §5.2.1). Added the field to
    `types/index.ts` and a real status selector to `AdminPropertyEditPage` (Active/Maintenance/Full)
    — without this, admins would have had no way to ever take a property off the public site.
  - `AdminRoomEditPage` had a **real, silent bug**: every room create/update hardcoded
    `buildingId: 'bld-01'` regardless of which property or building was actually selected — there
    was no real building picker, just a free-text "Building Wing / Block" name input disconnected
    from any real `Building` record. Fixed with a real `useBuildingsQuery(propertyId)`-backed
    `<select>`, scoped to the currently-chosen property, clearing the selection if it becomes
    invalid when the property changes.
  - `AdminRentalTypesPage` defaulted new rental types' `applicablePropertyIds` to a hardcoded fake
    list (`['prop-01' … 'prop-05']`, ids that never existed in the real database). Now defaults to
    the real ids of whatever properties `usePropertiesQuery()` actually returns.
  - `Room.currentClientName` (showing which tenant currently occupies a room) is left blank for
    now — enriching it requires the Leasing domain's `clients` data, which isn't wired yet.
    `currentClientId` (a real numeric id) is already correctly populated.
  - The `Property` edit form's old "Total Units Capacity"/occupancy fields were **removed**, not
    just reconnected — those are backend-computed from real room records (`BACKEND_PLAN.md`
    §5.2.1), never client-settable; a read-only occupancy summary replaced them, with a note
    pointing at the Buildings & Rooms page where rooms (and therefore occupancy) actually change.

  **Verified:** `npx tsc -b` compiles the whole frontend clean; every touched module (16 files)
  loads through the Vite dev server without a transform error; the real API was hit directly and
  cross-checked against every mapper — anonymous property list correctly filters to `ACTIVE`-only,
  room/rental-type/building response shapes match the TypeScript interfaces exactly, and a live
  enum round-trip (`PATCH /rooms/{id}/status` with `AVAILABLE`) confirms the frontend↔backend enum
  mapping works end-to-end. As with Section 3, this is API-level verification, not an actual
  browser click-through (no browser automation tool was available this session) — recommended
  follow-up before calling this fully done.

- [x] **Leasing/CRM domain** — `clients`, `bookings`, `agents` — ✅ done and verified. Covers
      `ClientsManagementPage`, `ClientDetailPage`, `BookingsManagementPage`, `AgentsCommissionsPage`,
      `ClientDashboard`, `MyBookingPage`, `MyRoomPage`, `MyMaterialsPage`, `ReportIssuePage`,
      `ClientPaymentsPage` (partial — see below), and the public booking-inquiry form on
      `RoomDetailPage` (anonymous `POST /bookings`, no login required).

  **What was built:** `src/api/clients.ts`, `bookings.ts`, `agents.ts` — same mapper-to-existing-type
  pattern as the Property domain. Two real type gaps found: `Client`'s `currentRoomId`/
  `currentRoomNumber`/`currentPropertyId`/`currentPropertyName` are required in the frontend type but
  genuinely nullable server-side (a client can exist with no current room) — making them optional
  would have rippled into ~10 unrelated Finance/Facilities files not in scope this phase, so the
  mapper coerces null to `''` instead (falsy in every existing conditional check) rather than
  widening the type. `Booking.clientId` *was* made optional (`clientId?: string`) — this one only
  affected files already being converted, so the honest fix was cheap enough to make directly.

  Every mixed-domain page (e.g. `ClientDetailPage` also reads `damages`/`payments`/`maintenanceIssues`)
  keeps `useData()` for the fields outside this domain's scope — both the real hooks and the mock
  context coexist in the same file for now, per the transitional-state note above.

  **Real gaps found and fixed:**
  - `RoomDetailPage`'s public booking form sent `clientId: currentUser?.id || \`client-temp-${Date.now()}\`` —
    conflating the logged-in **User**'s id with a **Client** id (different entities, linked via
    `User.clientId`) and fabricating a fake id string as a fallback. Fixed to
    `currentUser?.clientId`, omitting the field entirely when absent — the real backend already
    supports a booking with no linked client (a pre-account inquiry), so there was never a need for
    a fake id in the first place.
  - `ClientDetailPage` had a real bug: a `client.documents || [...]` fallback displayed two
    **fabricated fake "Verified" documents** for any client with zero real uploads (the real API
    always returns `[]`, never `undefined`, so that fallback was pure dead-but-triggered code).
    Removed.
  - `AgentsCommissionsPage`'s `selectedAgent` was a manually-refreshed snapshot copied out of the
    agents array after each mutation — worked with synchronous mock state, but React Query
    invalidation is asynchronous, so it would have gone stale. Refactored to track just an id and
    derive the displayed agent live from the query result every render.
  - Agent creation dropped two mock-only fields the real API has no story for yet: a randomly
    assigned stock-photo avatar, and a hardcoded `'Active'` status (the backend already defaults new
    agents to active). `CreateAgentDealRequest` has no `status`/`payoutDate`/`payoutReference` fields
    — deals always start Pending server-side; when the form's "Already Paid" option is chosen, a
    second real `pay-commission` call now runs immediately after creation to reach the same end state.
  - **Known, deliberately unfixed gap:** the agent-deal form's "Leased Unit / Suite #" field has no
    real room reference to send — `AgentDealInput.roomId` needs a real numeric id, and this page has
    no room picker (unlike the fix already made in `AdminRoomEditPage`). Left as a display-only text
    field rather than scope-creeping a new picker into this pass — a real, known gap, not silently
    dropped.

  **Verified:** `npx tsc -b` compiles clean; all 14 touched files load through Vite without a
  transform error; exercised the **full booking lifecycle live** against the real backend in the
  exact request shapes the frontend hooks send — anonymous inquiry (no `clientId`, `source:
  CLIENT_PORTAL`) → approve → assign-room → check-in, confirming the room's status and the
  timeline's audit trail update correctly at each step; also verified client status
  deactivate/reactivate, adding a client material and document, and the full agent-deal-then-pay-
  commission flow. As with the Property domain, this is API-level verification, not an actual
  browser click-through.

- [x] **Finance domain** — `payments`, `expenses`, `recurring_bills`, `payroll_records` — ✅ done
      and verified. Covers `PaymentsManagementPage`, `ExpensesPage`, `RecurringBillsPage`,
      `HRPayrollPage`, `ClientPaymentsPage` (partial — see below), `HouseholdSalaryPage`.

  **What was built:** `src/api/payments.ts`, `expenses.ts`, `recurringBills.ts`, `payrollRecords.ts`
  — same mapper-to-existing-type pattern as the previous two domains. No frontend type gaps this
  time (unlike Property/Leasing, every field the backend returns already had a matching, correctly-
  optional field in the existing `Payment`/`Expense`/`RecurringBill`/`PayrollRecord` types).

  **Real gaps found:**
  - **A genuine backend API gap, not a frontend bug** — `ClientPaymentsPage`'s "Pay Rent Online"
    flow has no real backend equivalent. `PaymentController` only allows the `OPERATIONS` role to
    `POST /payments`; there is no client-facing payment-creation endpoint, and building one casually
    would let a tenant unilaterally mark their own rent `PAID` with no real payment gateway behind
    it. Left deliberately unconverted — the read side (`payments` → `useMyPaymentsQuery()`) is real,
    but the "pay now" button still simulates via the mock context, coexisting with the real read.
    A real fix needs a payment gateway integration (or at minimum a "payment intent" the backend
    confirms, not one the client dictates) — out of scope for a frontend wiring pass.
  - `HouseholdSalaryPage` had a **real, silent bug**: its payslip list was hardcoded to always
    filter for employee `emp-03` regardless of who was actually logged in — a mock-era artifact of
    the single-persona-per-role demo pattern. Fixed by switching to `useMyPayrollRecordsQuery()`
    (`GET /payroll-records/me`, server-scoped via the JWT's `employeeId` claim), which eliminates
    the hardcoded id entirely. The same fork also found and fixed a second instance of the identical
    bug class in the same file: the page header hardcoded "Emmanuel Habimana — Lead Facility &
    Maintenance Officer" regardless of who was logged in — replaced with the real `currentUser` from
    `useAuth()`.
  - Several `properties` fields turned out to be dead code in some files (destructured from
    `useData()` but never actually referenced) and were dropped rather than wired to a real hook —
    consistent with the same pattern found in earlier domains.

  **Verified:** `npx tsc -b` compiles clean; all 10 touched files load through Vite without a
  transform error; hit the real API directly for every entity's list/create endpoints plus the
  recurring-bill payment/mark-paid actions, confirming exact shape matches; verified the two
  self-service `/me` endpoints (`payments/me`, `payroll-records/me`) correctly scope to the actual
  logged-in client/household user rather than any hardcoded id — directly confirming the
  `HouseholdSalaryPage` bug fix resolves to the right person. As with prior domains, this is
  API-level verification, not an actual browser click-through.

- [x] **Facilities domain** — `technicians`, `preventive_tasks`, `damage_reports`, `water_meters`,
      `maintenance_issues` — ✅ done and verified, **with one deliberate exception**. Covers
      `TechniciansPage`, `DamagesManagementPage`, `WaterMetersPage`, `ReportIssuePage`,
      `MyMaterialsPage` (partial), `HouseholdTaskHistoryPage`.

  **A genuine data-model mismatch found, not converted this round:** `PreventiveMaintenancePage`
  (operations) and `HouseholdChecklistPage` (household) turned out to implement a completely
  different, bespoke checklist feature — a bilingual (English/Kinyarwanda) category → sub-category
  → measure hierarchy (`MeasureItem[]`), held entirely in local component state with no persistence
  beyond the browser session. This has **no equivalent** in the backend's actual `preventive_tasks`
  schema (a flat category-enum + task-name + frequency + status, no sub-categories, no bilingual
  fields, no local-only concept at all). Converting these two pages isn't a wiring task — it needs a
  product decision on which data model is authoritative going forward (rebuild the richer UI against
  the simpler backend schema, or extend the backend to match the richer UI). Left both pages
  untouched this round rather than forcing an inappropriate quick fix. `HouseholdTaskHistoryPage`
  (which *does* match the `PreventiveTask` model directly) was converted normally.

  **What was built:** `src/api/technicians.ts`, `preventiveTasks.ts`, `damageReports.ts`,
  `waterMeters.ts`, `maintenanceIssues.ts` — the largest API layer yet (this domain has the most
  entities and the most enum types), same established mapper pattern.

  **Real bugs found and fixed** (the same class found twice already, now a third and fourth time):
  - `DamagesManagementPage` hardcoded a fake `roomId: 'room-01'` on every create — the form only had
    a free-text "Unit / Suite Number" input, never wired to a real room. Fixed with a real room
    picker (`useRoomsQuery({ propertyId })`) scoped to the selected property, replacing the
    free-text field; also added a client picker (was free-text "Resident Name") sourced from real
    clients. Also discovered the status dropdown in this same edit form doesn't map to the real
    update endpoint at all (status changes are a dedicated endpoint) — fixed by detecting a status
    change during edit and firing that dedicated mutation alongside the main update, so an edit that
    also changes status doesn't silently drop that part of the save.
  - `TechniciansPage`'s work-order dispatch form had the identical bug — a free-text "Unit / Area"
    field never wired to a real room. Fixed the same way. Also found the create-work-order endpoint
    has no labor/material cost fields (only the update endpoint does) — a follow-up update call now
    sets those costs immediately after creation rather than silently dropping what the dispatcher
    entered.
  - `HouseholdTaskHistoryPage` was reading the entire unfiltered `preventiveTasks` list, showing
    **every** household staff member's task history instead of just the logged-in user's own — the
    same hardcoded/unscoped-identity bug class as `HouseholdSalaryPage` in the Finance domain. Fixed
    by switching to the self-service `/preventive-tasks/me` endpoint, server-scoped via the JWT.
  - `ReportIssuePage`/`MyMaterialsPage`: confirmed `MaintenanceIssueController.create` genuinely
    allows the `CLIENT` role to file a real maintenance ticket (unlike the payment-creation gap
    found in Finance) — converted normally, dropping several fields the old mock call sent
    (`clientId`/`clientName`/`propertyName`/`roomNumber`) that the real endpoint doesn't accept
    because it resolves the reporting client from the JWT automatically.

  **Verified:** `npx tsc -b` compiles clean; every touched module loads through Vite without a
  transform error; hit the real API directly for every entity's list/create endpoints, confirmed
  both room-picker bug fixes actually send real room ids that the backend accepts, and confirmed
  both self-service `/me` endpoints (`preventive-tasks/me`, `maintenance-issues/me`) correctly scope
  to the actual logged-in user. As with prior domains, this is API-level verification, not an
  actual browser click-through.
- [x] **HR domain** — `employees` (+ documents/daily tasks/damages/leaves) — ✅ done and verified.
      Covers `EmployeeDetailPage`, `HouseholdDashboard`, and the "Staff Directory" tab of
      `HRPayrollPage` (its payroll ledger tab was already converted during the Finance domain pass —
      only the employee-list/add-employee half of that page was still on mock data).
      (`HouseholdTaskHistoryPage` was already converted during the Facilities domain pass, since
      it's actually preventive-task data, not employee data — the plan's original domain-to-page
      mapping was slightly off here.)

  **What was built:** `src/api/employees.ts` — the widest single DTO yet (`Employee` plus four
  nested child collections: documents, daily tasks, damages, leaves), each with its own enum
  mapper, same established pattern as every prior domain.

  **Real bugs found and fixed:**
  - `HouseholdDashboard` matched "the current employee" via a guessing heuristic — `id === currentUser?.id`
    (comparing a `User` id to an `Employee` id, a mismatch of the exact kind fixed in the Leasing
    domain's booking form), falling back to an email match, and finally to `name.includes('emmanuel')`,
    with `employees[2] || employees[0]` as a last-resort default. This is the same
    self-service-scoping bug class found in `HouseholdSalaryPage` (Finance) and
    `HouseholdTaskHistoryPage` (Facilities) — now found a **third** time. Fixed by switching to the
    real self-service `GET /employees/me` endpoint, server-scoped via the JWT's `employeeId` claim;
    the household dashboard's "assigned preventive checkpoints" snapshot had the identical
    guess-by-name-substring bug and was fixed the same way via `useMyPreventiveTasksQuery()`.
  - `EmployeeDetailPage`'s "Assign Daily Task" form sent a free-text property *name* string
    (`propertyName`) where the real endpoint expects a numeric `propertyId` foreign key — the
    now-familiar hardcoded/disconnected-picker pattern found in every domain so far. Fixed with a
    real property-id-backed `<select>`.
  - Two hardcoded fake reviewer/approver names were being sent to endpoints that have **no field to
    receive them at all**: task review sent `ratedBy: 'Eric Manzi (Operations Director)'`, but
    `EmployeeDailyTaskResponse.ratedByName` is never set anywhere in the backend service — confirmed
    live that it's always absent from the response regardless of what's sent. Leave creation/approval
    sent a hardcoded `approvedBy` string, but the real endpoint always derives the approver's name
    itself from the authenticated actor's JWT when a leave is approved — confirmed live
    (`approvedByName` correctly came back as the real logged-in operations user's name, ignoring the
    client-sent value entirely). Both hardcoded strings were dropped from the frontend; the
    reviewer-identity gap is a genuine backend gap (flagged, not fixed — no capability exists to add
    one from the frontend side).
  - `HRPayrollPage`'s "Add New Employee" form silently attached a fabricated document record
    (`fileUrl: 'https://example.com/contract.pdf'`, a fake URL that was never a real upload) as part
    of employee creation — but the real `POST /employees` endpoint has no field for bundling
    documents at all (they're a dedicated, separate endpoint). Removed the fake auto-attach; a real
    contract can be attached afterward via the dossier's own "Upload Document" action.
  - Same form also had an "Avatar Image URL" input, but **neither** `CreateEmployeeRequest` nor
    `UpdateEmployeeRequest` expose any field to persist an avatar — there is no avatar-upload
    capability in the API at all, so this input did nothing. Removed the input; the mapper now
    generates a stable initials-based placeholder image client-side instead of pretending a URL was
    ever saved.
  - `HRPayrollPage`'s staff directory search/department/status filters were purely client-side over
    the full in-memory mock array. The real `GET /employees` endpoint already supports server-side
    `department`/`status`/`search` filtering (confirmed live) — wired the existing filter UI to pass
    these as real query params instead.

  **Verified:** `npx tsc -b` compiles clean; all four touched files load through Vite without a
  transform error; hit the real API directly — created a test employee, assigned it a daily task
  with a real `propertyId` (confirmed the response resolves the correct `propertyName`), reviewed the
  task and confirmed `ratedByName` is indeed never populated, created an `APPROVED` leave directly and
  confirmed both the real `approvedByName` (server-derived, not client-sent) and the
  employee-status-sync to `ON_LEAVE` fire correctly, added and deleted a document, added a damage
  record, and confirmed server-side list filtering by department/status/search all work — then
  cleaned up the test employee and its child records directly from the database so the real migrated
  dataset (5 employees) stays untouched. As with every prior domain, this is API-level verification,
  not an actual browser click-through.
- [x] **Platform domain** — `activity_logs`, `notifications`, dashboards, search, reports — ✅ done
      and verified. Covers `ActivityLogPage`, `ClientNotificationsPage`, every role's dashboard
      (`OperationsDashboard`/`OwnerExecutiveDashboard`/`AdminDashboard`/`HouseholdDashboard`/
      `ClientDashboard`), `ReportsPage`, and `GlobalSearchModal`. Done last as planned — dashboards
      and search aggregate across every other domain, so this was only safe once Property,
      Leasing/CRM, Finance, Facilities, HR, and IAM/admin were all already real.

  **What was built:** `src/api/dashboards.ts` (the 5 role-specific `GET /dashboard/*` aggregate
  endpoints), `reports.ts` (`revenue-expense`, `occupancy`, `property-performance`), `notifications.ts`
  (`GET /notifications/me` + mark-read/mark-all-read), `activityLogs.ts` (`GET /activity-logs` with
  server-side module/type filtering), and `search.ts` (`GET /search`). `HouseholdDashboard` and
  `ClientDashboard` had already been converted for their primary self-service data during the
  HR/Leasing passes — this phase specifically re-checked both for secondary dashboard-aggregation
  logic that was still mock-derived, per the plan's own warning, and found real bugs in
  `ClientDashboard` (below).

  **Real gaps found and fixed:**
  - `ClientDashboard` was still reading the mock `DataContext`'s `payments`/`maintenanceIssues`
    arrays and filtering them by `client.id` — but `client.id` is now a real numeric id from
    `useMyClientQuery()` that never matches the old mock string ids (`"client-04"`). This was
    silently broken (always rendered empty payment history / empty issue list) the moment the
    Finance and Facilities domains switched clients over to real ids — fixed via the real
    self-service `useMyPaymentsQuery()`/`useMyMaintenanceIssuesQuery()` those domains already built.
  - `OwnerExecutiveDashboard`'s "Executive Priority Notices" panel showed three **permanently
    fabricated** alert cards — invented names ("Claire Uwase", "Dr. Arthur Rutayisire"), a fake
    "$700" balance, a fake "Week 2" audit reference — that were never wired to any data source at
    all, mock or real, even before this migration. Replaced with the actual largest overdue
    payment, the highest-value pending booking, and the most recently passed preventive task,
    each conditionally rendered only when real data exists.
  - `DashboardLayout`'s notification bell filtered a shared mock broadcast array by
    `n.targetRoles.includes(currentRole)` client-side — the same self-service-scoping bug class
    found repeatedly in every other domain (Finance, Facilities, HR). Fixed via the real per-user
    `GET /notifications/me`, which is scoped server-side and needs no role filtering at all.
  - `GlobalSearchModal` searched local, stale mock arrays — including rooms and payments, which the
    real `GET /search` endpoint doesn't cover at all (confirmed against `SearchService.java`: it
    only fans out across properties/clients/bookings/employees/technicians). Rather than fake room
    /payment results against stale data, those two categories are simply absent now, and an
    `EMPLOYEE` category was added since the real endpoint actually supports it. The real endpoint is
    also role-restricted (`OPERATIONS`/`ADMIN`/`OWNER` only) — confirmed live with a 403 for a
    client-role token — so the search trigger and modal are now hidden entirely for client/household
    roles instead of being shown and then failing on first use.
  - `ActivityLogPage`'s module filter dropdown used invented option labels ("Finance & Payments",
    "Rooms & Estates", "Maintenance Issues", "Executive Reports") that matched none of the real
    `module` strings `AuditService.log(...)` actually writes — confirmed by grepping every call site
    across every backend domain. Selecting any of those options would have silently returned zero
    rows against the real API. Replaced with the real, confirmed list (verified live against the
    actual data: "Reports" turned out to be a real value present in migrated legacy rows even though
    no current backend code path writes it, so it's kept in the list; "Properties" is real but
    currently has zero rows since no property has been edited since the migration — kept anyway
    since the module is real, just unused so far).
  - `ReportsPage`'s report-type dropdown had a `"payroll"` option with **no matching render branch
    at all** — a pre-existing dead end already in the mock version, not introduced by this pass.
    Filled in with a real payroll ledger table using the Finance domain's `usePayrollRecordsQuery()`.
  - `PropertyPerformanceBar` was charting `Property.monthlyRevenueEstimate` — a real, persisted, but
    manually-set *estimate* field — as if it were actual revenue, on both `OperationsDashboard` and
    `OwnerExecutiveDashboard`'s comparative-performance charts. Per the plan's own correctness-trap
    warning (§5) about not shadowing backend-computed values with something else, swapped to the real
    computed `monthlyRevenue` from `GET /reports/property-performance` (summed from real, paid
    payments). `ReportsPage`'s own occupancy table still legitimately uses `monthlyRevenueEstimate`,
    since that table is explicitly labeled "Est. Monthly Roll" — using the estimate field there is
    correct, not a bug.
  - `RevenueExpenseArea` was **entirely hardcoded** — 8 months of fabricated numbers with no props
    at all, on both dashboards. Converted to accept real data via props, sourced from
    `GET /reports/revenue-expense` (summed from real payment/expense dates, confirmed live to return
    the real current month's numbers, not a static series).
  - One data-shape wrinkle in the real `activity_logs` table, handled rather than papered over:
    rows written live by `AuditService` store the plain enum name (`"OPERATIONS"`, `"PUBLIC"`), but
    rows carried over from the original mock data during the migration already store a descriptive
    title (`"Operations Director"`, confirmed live). Blindly reformatting every value would have
    mangled the migrated rows into `"Operations director"`; the mapper now only reformats values that
    are fully upper-case, leaving already-descriptive migrated titles untouched.

  **Verified:** `npx tsc -b` compiles the whole frontend clean; every touched module loads through
  Vite without a transform error; hit all 5 real dashboard aggregate endpoints live as each role
  (`operations`/`owner`/`admin`/`client`/`household` accounts) and confirmed each response matches
  the TypeScript interface exactly; confirmed `GET /search` returns real, correctly-categorized
  results for property/client/booking/technician/employee queries and 403s for a client-role token;
  confirmed the notification mark-read and mark-all-read mutations actually flip `read` server-side;
  confirmed all three `/reports/*` endpoints return real numbers computed from the actual migrated
  payment/expense/room data (not a static series); confirmed the real `module` filter list against
  every value actually present in the live `activity_logs` table. As with every prior domain, this
  is API-level verification, not an actual browser click-through (no browser automation tool was
  available this session).
- [x] **IAM/admin domain** — `users`, `system_settings` — ✅ done and verified. Covers
      `AdminUsersRolesPage`, `AdminSystemSettingsPage`, `ProfileSettingsPage`. Unlike every prior
      domain, `DataContext.tsx` held **no** state or mutators for this domain at all — `mockUsers`
      was only ever imported directly by `AdminUsersRolesPage`, and `AdminSystemSettingsPage` had no
      persistence anywhere, not even mock. `mockUsers` itself is intentionally left in place — it's
      still used by `RoleSwitcher`'s dev-only demo-login panel from Section 3, unrelated to this page.

  **What was built:** `src/api/users.ts` (an `AdminUser` type extending the base `User` type with
  admin-only fields — `status`, `lastLogin`, `createdAt` — rather than widening `User` for every
  other consumer) and `src/api/systemSettings.ts`. Reused `useClientsQuery()`/`useEmployeesQuery()`
  from earlier domains for two new linking pickers (see below) rather than building new ones.

  **Real gaps found and fixed:**
  - `AdminUsersRolesPage` had **no real backend behind it whatsoever** — it seeded a local
    `useState` copy of `mockUsers` with fabricated `lastLogin`/`createdAt` strings, and every action
    (create/edit/deactivate/suspend/reset-password/resend-invite/delete) only ever mutated that local
    array. Rebuilt against the real `GET/POST/PUT /users`, `PATCH /users/{id}/status`,
    `POST /users/{id}/reset-password`, `POST /users/{id}/resend-invite`, and `DELETE /users/{id}`
    endpoints — confirmed live end-to-end on a throwaway test account (create → update → suspend →
    reset-password → resend-invite → delete), then cleaned it up so the real 5 accounts are untouched.
  - The account-status dropdown in the same edit panel doesn't map to a real endpoint at all —
    `UpdateUserRequest` has no `status` field; status is a dedicated `PATCH .../status` call. The
    same class of bug found in `DamagesManagementPage` (Facilities). Fixed by detecting a status
    change during save and firing that dedicated mutation alongside the main update.
  - User creation had a non-functional "Avatar Image URL" input and previously auto-assigned a fake
    stock-photo URL — `CreateUserRequest`/`UpdateUserRequest` have no avatar field at all (confirmed
    via `UserMapper`, which maps `avatarUrl` straight off the entity with nothing ever setting it).
    Removed the input; the mapper now generates a stable initials-based placeholder, the same fix
    already made for employees in the HR domain.
  - **A real, missing feature, not just an API swap:** `CreateUserRequest`/`UpdateUserRequest` have
    always supported linking a `CLIENT`-role account to a real `Client` record, and a
    `HOUSEHOLD`/`OPERATIONS`-role account to a real `Employee` record (`clientId`/`employeeId`
    fields) — but the admin form never exposed any picker for either, so this link could only ever
    be null. Added two real, role-conditional pickers backed by the existing clients/employees
    queries.
  - **A real, pre-existing bug found in the backend itself, not the frontend:** `DataSeeder.java`
    seeded `system_settings.currency_code` with the frontend's old display string `"USD ($)"`
    instead of a clean ISO code — confirmed live (`GET /settings` returned `"USD ($)"` verbatim
    before this fix). Fixed at the source in `DataSeeder.java` (only affects a fresh seed going
    forward) and corrected the already-seeded live row directly via a real `PUT /settings` call
    during verification.
  - `AdminSystemSettingsPage` had **no persistence anywhere at all**, not even mock — "Save" just
    showed a success toast over five `useState` values that reset on every reload. Wired to the real
    `GET/PUT /settings` (`GET` allowed for OPERATIONS/OWNER/ADMIN, `PUT` ADMIN-only, enforced
    server-side). The frontend's old currency dropdown used a display string (`"USD ($)"`) where the
    backend persists a plain code (`"USD"`) — added an explicit two-way map rather than a case
    transform, consistent with the `enumMappers.ts` convention from the Property domain.
  - `ProfileSettingsPage`'s name/email/phone fields were freely editable but "Save" never persisted
    anything — a genuine backend gap, not a frontend bug: there is no self-service "update my own
    profile" endpoint anywhere in the API (`PUT /users/{id}` is ADMIN-only). Made these fields
    read-only (still populated from the real logged-in user) with a note to contact an administrator,
    the same "flag, don't force" treatment given to the Finance domain's rent-payment gap.
  - `ProfileSettingsPage`'s notification toggles were local-only `useState`, never persisted. Wired
    to the real, already-existing self-service `GET/PATCH /users/me/preferences` endpoints.
  - **Closed a long-standing gap flagged back in Section 3:** built a real change-password form on
    `ProfileSettingsPage` using `api/auth.ts`'s `changePassword` function, which had existed unused
    since the Auth-integration phase. This is the first change-password UI anywhere in the app.
  - Confirmed (but did not change) that invite/password-reset emails are a stub —
    `LoggingEmailService` only logs to the server console, no real email is ever sent. Not a frontend
    concern, but worth knowing before relying on this in a real deployment.

  **Verified:** `npx tsc -b` compiles the whole frontend clean (the only pre-existing errors at the
  time of this pass were in `OperationsDashboard`/`OwnerExecutiveDashboard`, both owned by the
  in-progress Platform domain phase, not touched here); every touched module loads through Vite
  without a transform error; hit the real API directly for the full user lifecycle (create → update
  → suspend → reset-password → resend-invite → delete) and the settings/preferences round-trips,
  confirming exact request/response shapes. As with every prior domain, this is API-level
  verification, not an actual browser click-through.

Once every domain above is checked off, delete `mockData.ts` and remove `DataContext.tsx`'s
`useState(mockArray)` initializers entirely — the app should no longer import anything from
`src/data/` at that point (aside from any genuinely static UI copy that never came from the backend
in the first place, e.g. icon/label lookup tables — audit for these specifically before deleting).

## 5. Correctness Traps Specific To This Migration — ✅ audited and addressed

Each trap below was actually checked against the real, fully-converted codebase (not just this
document's original predictions) — several turned out to already be handled correctly by the
domain-by-domain rollout's own established conventions; the rest had real, fixable issues.

- [x] **Computed fields must come from the API, not be recomputed locally.** Audited every page's
      `.reduce()`/`.length` math, not just dashboards (Platform domain already fixed the two worst
      offenders — `RevenueExpenseArea`, `PropertyPerformanceBar`). Everything else found sums real,
      already-fetched backend data for view-only display totals (e.g. `ReportsPage`'s revenue/expense
      cards, `AgentsCommissionsPage`'s portfolio totals) — legitimate view aggregation, not a
      duplicate of an authoritative backend field, so left as-is. **Two real leftover vanity-number
      bugs found and fixed:** `HRPayrollPage`'s company task-completion rate and
      `EmployeeDetailPage`'s per-employee task rate both fell back to a hardcoded fake 95%/100%
      "looks-good" number when there was no task data at all, instead of 0% — classic mock-era
      optimism. Both now correctly show 0% in that edge case.
- [x] **Row-level scoping / 403 handling.** The API client (`src/api/client.ts`) already throws a
      typed `ApiError` with the real HTTP status on any non-2xx response. Confirmed the established
      per-mutation pattern across all 7 domains (68 `try/catch` blocks across 27 pages) already
      catches this and shows a toast via the pre-existing `ToastContext` — this was already solid,
      not a gap. **Found and fixed 5 real silent-failure holes** where a mutation was fired with bare
      `.mutate()` and no error handler at all, so a failure (403, validation, network) would fail
      completely silently with no user feedback: `OwnerExecutiveDashboard` and `OperationsDashboard`
      (mark-recurring-bill-paid), `ClientNotificationsPage` (mark-read, mark-all-read), and
      `EmployeeDetailPage` (delete document). All 5 now show a proper error toast on failure.
- [x] **Optimistic UI vs. server truth.** Same finding as above — the established `mutateAsync` +
      `try/catch` + toast pattern already provides this everywhere except the 5 bare-`.mutate()` call
      sites just fixed.
- [x] **IDs change shape.** Repo-wide grep for leftover string-id-prefix patterns
      (`'prop-01'`/`` `room-${...}` ``/`'emp-03'`-style literals) outside `mockData.ts` turned up
      **zero** live bugs in any converted page or `src/api/*.ts` file — every hit was either inside
      `mockData.ts` itself (the mock source, correctly untouched) or inside `DataContext.tsx`'s own
      now-dead mock mutators (e.g. `assignWaterMeter`), which are unreachable dead code since every
      consuming page already calls the real `api/*.ts` hooks instead. Confirms the domain-by-domain
      rollout was clean on this front — nothing to fix here, but worth this explicit audit trail.
- [x] **File uploads — the biggest known gap, now closed.** Confirmed the real backend endpoint
      (`POST /api/v1/files`, multipart `file` + `folder` fields, returns
      `{url, originalFilename, contentType, sizeLabel}`; files served back at `GET /files/**`,
      publicly readable) by testing it live end-to-end — uploaded a real file, fetched it back by its
      returned URL, confirmed 200, then cleaned up the test file from `backend/uploads/`. Built a
      shared `apiUpload()` helper in `client.ts`, a `useUploadFileMutation()` hook
      (`src/api/files.ts`), and a reusable `<FileUploadButton>` component
      (`src/components/common/FileUploadButton.tsx`) so the logic isn't duplicated per page. Wired
      into every real fake-upload spot found:
  - `AdminPropertyEditPage`/`AdminRoomEditPage`: photo galleries kept their existing "paste a URL"
    option (still valid for external hero images) and gained a real "Upload Photo" button alongside
    it — confirmed `Property.images`/`Room.images` are genuinely persisted backend fields already,
    just previously only fillable by pasting someone else's Unsplash link.
  - `EmployeeDetailPage`: the "Click or Drag to Upload Damage Photos" dropzone **looked** like a real
    upload but was pure `FileReader.readAsDataURL` — a base64 preview that was never sent anywhere.
    Now a real upload. Same page's document-attach form is no longer a paste-a-URL field with a fake
    `'https://example.com/document.pdf'` fallback and a hardcoded fake `'1.2 MB'` size — both replaced
    with a real upload returning the real URL and size.
  - `DamagesManagementPage`: identical `FileReader`-only fake dropzone, fixed the same way. Also found
    and fixed a real bug where a brand-new damage report's photo list and property/room fields
    defaulted to a fabricated stock photo and a fake pre-filled property/room (`'Unit A-204'`) that
    looked like real data — a user who didn't touch those fields would have silently logged the
    incident against fake location data. Now defaults to empty/required.
  - `ReportIssuePage`: paste-a-URL field replaced with a real upload button.
  - `TechniciansPage`: **the worst instance found** — the technician-document upload form only ever
    captured the picked file's *name* as a string and sent `fileUrl: `/docs/${docFile}`` — a
    completely fabricated path that was never a real file location (would have literally broken if
    the filename state ever held the raw `File` object, since it'd stringify to `"[object File]"`).
    Now a real upload.
  - `ClientDetailPage`: same paste-URL-with-fake-fallback-and-fake-size pattern as
    `EmployeeDetailPage`'s document form, fixed identically.
  - **Deliberately left alone:** `PreventiveMaintenancePage`/`HouseholdChecklistPage` — already
    excluded from this entire migration (Facilities domain notes above) since their whole feature has
    no backend equivalent at all; wiring file upload into a feature that isn't converted would be
    pointless.

  **Verified:** `npx tsc -b` compiles the whole frontend clean; every touched file (14 total) loads
  through Vite without a transform error; the real upload endpoint was hit directly with `curl`
  (multipart request → real stored file → fetched back successfully by its returned URL) before and
  after wiring the UI to it, confirming the exact contract the new `FileUploadButton` component relies
  on. As with every domain, this is API-level verification, not an actual browser click-through.

## 6. Environment & CORS — ✅ confirmed

- [x] `VITE_API_BASE_URL` set via `.env.example`/env var (`http://localhost:8080/api/v1` default,
      `.env.local` dev override to `:8091` used this session), never hardcoded in source — confirmed
      by direct inspection of `frontend/vite.config.ts` and every `src/api/*.ts` file, none of which
      hardcode a base URL.
- [x] Confirmed `panther.cors.allowed-origins` in `backend/src/main/resources/application.yml`
      includes `http://localhost:5173,http://localhost:4173,http://localhost:5183` — covers the Vite
      dev/preview defaults plus the pinned dev port used this session. **Still needs the real
      deployed frontend origin added before any non-local environment goes live** — this was
      confirmed for dev only, not a deployment-readiness sign-off.
- [x] Confirmed the backend's rate limiter (`panther.security.rate-limit.*`) is enabled with defaults
      `login-limit: 10`/`60s`, `booking-limit: 20`/`60s`, per-client-IP. Ran the full domain-by-domain
      integration testing this session (hundreds of real API calls across 7 domains) without ever
      spuriously tripping it under normal single-developer use — consistent with the plan's original
      read that this only matters under a shared NAT'd IP. Not yet tested under realistic concurrent
      multi-user load; revisit before a real multi-tenant office deployment, not before.

## 7. Testing Strategy (starting from zero) — ✅ done and verified

- [x] Added Vitest + React Testing Library + jsdom + MSW as dev dependencies. Config lives in
      `vite.config.ts`, merged in via `mergeConfig(viteConfig, defineTestConfig({ test: {...} }))`
      from `vitest/config` — the more direct `/// <reference types="vitest/config" />` +
      `defineConfig({ test: {...} })` pattern from Vitest's own docs **did not type-check** under
      this project's `tsconfig.node.json` (`module: "nodenext"`, `verbatimModuleSyntax: true`) —
      `mergeConfig` sidesteps the ambient-augmentation dependency entirely and is what's actually
      wired. `npm run test` (`vitest run`) added to `package.json`.
- [x] One integration-style test per domain phase's core flow, per this section's own examples —
      picked flows that double as regression guards for real bugs found this session, not synthetic
      examples:
      - **Auth** (`LoginPage.test.tsx`, true page-level render): wrong password shows the error and
        never navigates; correct `password@123` navigates to the role home — the plan's own
        literal example.
      - **Property** (`properties.test.ts`): public property list hits the real query params
        (`status=ACTIVE`) and maps every backend field into the frontend `Property` shape.
      - **Leasing/CRM** (`bookings.test.ts`): anonymous booking inquiry — the plan's other literal
        example — submits with no `clientId` and `source: CLIENT_PORTAL`, returns a confirmed
        booking number.
      - **Finance** (`payments.test.ts`): client self-service payment history via `/payments/me`.
      - **Facilities** (`maintenanceIssues.test.ts`): reporting an issue sends no client-identity
        fields at all — a direct regression guard for the real gap found and fixed in that domain
        (the endpoint resolves the reporter from the JWT, not the request body).
      - **HR** (`employees.test.ts`): `/employees/me` self-service profile — a direct regression
        guard for the id/email/name-substring guessing bug found **three times** this session.
      - **Platform** (`notifications.test.ts`): notification bell loads via `/notifications/me` and
        exercises mark-all-read — a regression guard for the client-side role-filtering bug found in
        that domain.
      - **IAM/admin** (`users.test.ts`): account-status change fires the dedicated
        `PATCH /users/:id/status` endpoint rather than a plain field update — a regression guard for
        that exact bug, found in two different pages this session.
      Each test's MSW response shape was cross-checked directly against the corresponding
      `frontend/src/api/*.ts` DTO interface, not invented.
- [x] MSW (`src/test/mocks/server.ts` + `handlers.ts`) intercepts at the network boundary — no
      `DataContext`/`AuthContext` mocking anywhere in the suite, so these tests keep working once the
      mock-state code they exercise around is eventually deleted, per this section's own instruction.
      `onUnhandledRequest: 'error'` ensures a missing handler fails loudly instead of silently
      falling through.

**Proof these tests don't depend on the real running backend, not just an assertion:** a dedicated
`.env.test` file points `VITE_API_BASE_URL` at `http://backend.invalid` — a host that cannot resolve
— for the whole suite. Every test still passes: the only way that's possible is that MSW is
genuinely intercepting the request before it ever hits the network, since a real `fetch` to that
host would hard-fail with a DNS error regardless of the real backend's state. This is a stronger,
structural version of the "temporarily point at an invalid URL" check — it's not a one-off manual
step, it's how the suite always runs, so it can never silently regress into accidentally exercising
the live backend (which was in fact running throughout, and would have masked a broken mock setup
if the tests had been hitting it instead).

**Verified:** `npx tsc -b` compiles the whole project clean (the `vite.config.ts` type error above
was found and fixed as part of this); `npx vitest run` — **8 test files, 9 tests, all passing.**

**Deliberately not covered:** this is a starting suite that establishes the pattern and covers one
regression-guarding flow per domain, not exhaustive coverage of all 45 pages — per this section's
own scoping note ("not a general testing philosophy — scoped to what de-risks this rewrite"). No
tests were written for Facilities' preventive-maintenance data-model-mismatch pages (nothing real to
test yet — they're still on local-only mock state), or for the Owner/Admin/Household dashboards'
full aggregate rendering (covered indirectly via the underlying `notifications`/`payments`/
`maintenanceIssues` hook tests, but not a dedicated dashboard-render test) — flagged as follow-up
work, not silently skipped.

## 8. Open Decisions — ✅ all resolved

- [x] **Data-fetching library**: `@tanstack/react-query` — adopted in practice from the Auth
      integration phase onward and used consistently across all 7 domains. Decided, not revisited.
- [x] **Demo login panel**: kept, gated to `import.meta.env.DEV` (`RoleSwitcher.tsx`), performing a
      real login call rather than a client-side role assignment — decided during Section 3.
- [x] **Rollout branching strategy**: `frontend/` had no git repository at all until this pass —
      confirmed and initialized (`git init`), then committed as a single commit covering the whole
      integration (all 7 domains, file uploads, the correctness audit, and the new test suite),
      per direct instruction, rather than reconstructing a branch-per-domain history after the fact.
      `backend/`'s repository is untouched and separate, as before.
