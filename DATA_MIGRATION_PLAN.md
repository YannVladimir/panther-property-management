# Panther PMS — Frontend Mock Data → Real Database Migration Plan

**Status: executed and verified.** All 6 items below are done — see the "Execution Notes" callouts
inline (search for **✅ EXECUTED**) for what actually happened, including one architectural deviation
from this plan's original design (a Java seeder instead of a hand-written Flyway SQL migration) and
one further correction to the D1/D2 decisions below, made after reading the actual contradictory
records directly instead of relying on a summary.

**Goal:** move every real property/tenant/staff record currently hardcoded in the frontend into the
real Postgres backend, with zero data loss, before the frontend is switched over to live API calls
(see the companion `FRONTEND_INTEGRATION_PLAN.md`). This data represents actual properties — it is
being treated as production data to preserve, not throwaway demo fixtures.

**All migrated user accounts get the password `password@123`** (per explicit instruction), BCrypt-hashed
the same way the existing `DataSeeder` hashes the default admin password, with `mustChangePassword=false`
(these are real accounts being brought up with a real, if temporary-by-convention, shared password —
not a forced-reset placeholder like the bootstrap admin account).

---

## 1. Source of Truth

Single file: `frontend/src/data/mockData.ts` (2,280 lines). It is consumed by `DataContext.tsx` purely
via `useState(mockArray)` — confirmed there is **no localStorage persistence of any domain data**
(localStorage only remembers which demo role was last "logged in"). This means `mockData.ts` is the
**complete and only** source of truth to migrate; nothing a user has clicked/edited in the browser
needs to be separately recovered.

## 2. Full Record Inventory

| Entity | Count | Nested children | Notes |
|---|---:|---|---|
| Users | 5 | — | one per role (operations, owner, client, household, admin) |
| Properties | 2 | images, amenities | "Gacuriro Vista Suites", "Nyarutarama Golf View Lofts" |
| Buildings | 4 | — | 2 per property |
| Rental types | 4 | 23 included-material template rows total | |
| Rooms | 10 | images/amenities/utilities/rules | 6 + 4 across the two properties |
| Clients | 6 | 15 materials total; **0 documents** | |
| Bookings | 5 | 17 timeline events total | |
| Payments | 10 | — | |
| Expenses | 6 | — | |
| Recurring bills | 7 | **0 bill-payment rows** | |
| Technicians | 5 | 4 work orders total (only 2 techs have any); **0 documents** | |
| Preventive tasks | 8 | — | |
| Damage reports | 3 | — | |
| Water meters | 4 | 16 history rows total | |
| Employees | 5 | 7 daily tasks, 1 damage, 7 documents; **0 leave records** | |
| Payroll records | 4 | — | |
| Agents | 3 | 7 deals total | |
| Maintenance issues | 3 | — | |
| Activity logs | 6 | — | |
| Notifications | 7 | — | uses relative-time strings ("2 hours ago"), not timestamps |
| System settings | **0** | — | no mock data exists — seed a sensible default instead (see 6.11) |
| Notification preferences | **0** | — | no mock data exists — nothing to migrate |

**Total: ~103 primary records + ~100 nested child records ≈ 200 rows**, small enough to migrate in a
single transactional run, but with enough cross-references that a careless copy would corrupt the
schema's referential integrity (see section 3).

## 3. Data Quality Issues Found — and How This Migration Resolves Each

The mock data was authored over time by hand and has accumulated inconsistencies that a literal
copy would carry into the real database, corrupting exactly the invariants the backend schema is
designed to guarantee (e.g. `rooms.status` driving property occupancy counts). Each is called out
explicitly here — rather than silently "fixed" — because a couple of these are judgment calls about
real tenants that only the property manager can confirm after import.

| # | Issue | Affected records | Resolution applied by the migration |
|---|---|---|---|
| 1 | Denormalized `propertyName` snapshot fields are systematically stale — every record outside `properties`/`buildings`/`rooms` that references `prop-01` shows the old name "Kigali Heights Residences" instead of the current "Gacuriro Vista Suites" | clients, payments, expenses, damages, water meters, maintenance issues, preventive tasks referencing prop-01 | **Not migrated at all.** The backend deliberately never stores these display-name snapshots (see `BACKEND_PLAN.md` §5) — they're joined at read time. The stale strings are simply dropped; nothing is lost since the real property name is looked up live. |
| 2 | Dangling property references — `prop-03` and `prop-04` are referenced by several records but don't exist in `mockProperties` (only `prop-01`/`prop-02` exist) | client-03/client-05, pay-04/pay-06/pay-10, exp-05/exp-06, dmg-03, wm-04 | The real, valid `roomId` on each of these records is used to **re-derive** the correct `propertyId` (every room unambiguously belongs to one real property). The fake `prop-03`/`prop-04` values are discarded. |
| 3 | `client-05` claims a lease on room-10 (`currentRoomId: room-10`), but room-10's own record shows `status: available` with no assigned client | client-05, room-10 | **Resolved in favor of the client record, not the room** (see §7, decision D1 — revised after reading both records directly, not just the field-level summary). `client-05`'s `monthlyRent`/`depositPaid`/`rentalType` (2200/2200/Executive Luxury) match room-10's real values exactly, and it carries dated, assigned materials — that's a specific, financially-consistent tenancy, not a fabricated one. Only the room-number/property-name *labels* are stale (fictional "VC-12"/"Vision City Executive Villas", same class of bug as issue #1). Migration sets `room-10.status = occupied` + `current_client_id = client-05` to match the client, rather than discarding the tenancy. |
| 4 | `client-04` claims `currentRoomId: room-05`, but room-05 itself shows `status: reserved`, not occupied, with no client assigned | client-04, room-05 | **Resolved in favor of the client record** — same reasoning as #3 (decision D2). `client-04`'s `currentRoomNumber` ("A-404"), `monthlyRent`/`depositPaid` (700/700), and a dated assigned material all match room-05 exactly. Migration sets `room-05.status = occupied` + `current_client_id = client-04`. |
| 3b | `exp-06` references the same fictional "Vision City Executive Villas" property name as `client-05`/`pay-06` (found by grep: this exact string appears in only these 3 records, nowhere else) | exp-06 | No `roomId` on `Expense` to cross-check directly, but the naming match to `client-05`/`pay-06` — which both resolve to prop-02 via `room-10` — is a reasoned (not arbitrary) basis to attribute it the same way. See decision D3. |
| 5 | Three bookings (`bk-102`, `bk-103`, `bk-104`) reference placeholder client ids (`client-pending-01/02/03`) that don't exist in `mockClients` | 3 bookings | This is the *intended* "pre-account inquiry" case the schema already supports (`bookings.client_id` is nullable, with `client_name`/`client_email`/`client_phone` snapshot columns). Migrated with `client_id = NULL` and the snapshot fields copied over as-is. |
| 6 | The `admin` user (Diane Umutoni) and employee `emp-02` (also Diane Umutoni, same email) are clearly the same person but aren't cross-linked — unlike `operations`/`emp-01` and `household`/`emp-03`, which already are | user-admin, emp-02 | Migration sets `users.employee_id` for the admin account to point at `emp-02`, closing the gap (matches the pattern every other staff account already follows). |
| 7 | Vanity/flavor aggregate numbers don't reconcile with the actual nested records (e.g. a technician shows `totalJobs: 78` with only 2 real work orders; an agent's `bookingsCount`/`clientsReferred` don't match its 4 real deals; a notification references "130 units"/"$143,200" against a dataset of 2 properties and 10 payments) | technicians, agents, one notification | **Not migrated.** These are computed/derived fields in the real schema (`BACKEND_PLAN.md` §5.2.1 etc.) — always calculated from real child rows, never stored. Post-migration these numbers will legitimately be much smaller and internally consistent. This is correct behavior, not a bug — called out explicitly in the verification checklist (§6) so nobody "fixes" it back to match the old vanity numbers. |
| 8 | Notifications use relative-time strings ("2 hours ago", "1 day ago") instead of real timestamps | 7 notifications | Converted to absolute `TIMESTAMPTZ` values anchored to the migration's run time (i.e. "2 hours ago" becomes `migration_run_time - 2h`). This preserves the relative ordering/recency the notifications were meant to convey. |
| 9 | All ids in the mock data are short hand-typed strings (`prop-01`, `client-06`, `wo-t01-02`), not the `BIGSERIAL` integers the real schema uses | every record | A migration-time `Map<legacyId, newId>` per entity type resolves every cross-reference during insert (see §5). The original legacy id is preserved in a `legacy_id` note in the migration's log output for traceability, but is **not** stored as a column in the real schema (no frontend code will ever need to look it up by the old string id again once the frontend is talking to the real API). |

## 4. Why a Flyway Migration (Not an Ad-Hoc Script) — superseded, see ✅ EXECUTED note below

The backend already uses versioned Flyway migrations (`V1__iam.sql` … `V8__platform.sql`) tracked in
`flyway_schema_history`, applied automatically on startup and never re-applied once recorded. That
mechanism is the right fit here too: it makes the import **run exactly once**, reviewable in version
control like every other schema change, and safe against accidental re-runs (which would otherwise
create duplicate properties/clients/etc.).

Because BCrypt hashing needs to happen once, not per-deploy, the plan precomputes a single BCrypt hash
for `password@123` and embeds that literal hash in the SQL (standard practice for seed migrations —
the plaintext is already known/documented, so there's no secret being exposed by committing the hash).

> **✅ EXECUTED — architecture changed at implementation time.** Hand-writing ~200 rows of
> interlinked SQL across ~40 tables, using natural-key subqueries to resolve every cross-reference
> (property `code`, client `identification_number`, employee `national_id`, etc.), turned out to be
> considerably more error-prone than reusing the backend's own JPA entity classes with real,
> in-memory Java object references. The actual implementation is a Spring `ApplicationRunner`
> (`LegacySeedRunner`, in `com.panther.pms.platform`) instead of a Flyway SQL file — see section 5's
> updated description. It keeps the same guarantees this section cared about (runs once, reviewable,
> safe against accidental re-runs) via a config flag plus a hard skip-if-not-empty check, rather than
> via `flyway_schema_history`. The BCrypt hash was generated with the app's own real
> `BCryptPasswordEncoder` bean (via a temporary throwaway JUnit test, deleted immediately after use)
> to guarantee it verifies correctly at login — confirmed live, see section 6.

## 5. Migration Architecture — as actually implemented

1. **Extraction script**: `frontend/scripts/extract-legacy-data.ts`, run via `npx tsx`. Imports the
   real `mockData.ts` arrays directly (no hand-transcription — zero risk of transcription error),
   applies every fix in section 3, and writes `backend/src/main/resources/legacy-seed/legacy-seed-data.json`.
   Every legacy string id is kept under a `legacyId` field (and every cross-reference as `xLegacyId`)
   for the seeder below to resolve.
2. **Java seeder**: `LegacySeedRunner implements ApplicationRunner` (`com.panther.pms.platform`),
   `@Order(Ordered.LOWEST_PRECEDENCE)` so it runs after the existing `DataSeeder`. Reads the JSON via
   Jackson and inserts via the real repositories, maintaining an in-memory `Map<String, Entity>` per
   entity type (legacy id → saved JPA entity) so later inserts can resolve real generated ids through
   actual object references — no subqueries, no natural keys, compiler-checked field names throughout.
   Insertion order: properties → buildings → rental types (+ included materials, + applicable-property
   join) → rooms (client link deferred) → agents (+ deals, since `Booking.agent` is a hard FK) →
   clients (+ materials) → employees (+ documents/daily tasks/damages) → a backfill pass setting each
   room's `currentClientId` now that client ids exist (rooms and clients reference each other, so one
   side has to go first and get patched) → users (upserted by email, since `DataSeeder` may already
   have created the bootstrap admin row) → bookings (+ timeline) → payments → expenses →
   recurring_bills → technicians (+ work orders + documents) → preventive_tasks → damage_reports →
   water_meters (+ history) → maintenance_issues → payroll_records → activity_logs → notifications
   (+ per-user recipient rows, matching every user whose role is in the notification's `targetRoles`).
3. **Idempotency & safety**: gated by `panther.legacy-seed.enabled` (default `false` everywhere,
   set in `application.yml`), plus a hard skip-with-warning if `propertyRepository.count() > 0` —
   two independent guards against accidentally seeding a non-empty database.
4. **Atomicity**: the whole `run()` method is `@Transactional` — any failure rolls back the entire
   import rather than leaving a half-seeded database.

> **✅ EXECUTED.** Ran against a fresh Postgres (the project's own `docker-compose.yml` `db` service,
> after clearing out unrelated leftover smoke-test data from earlier backend development — 3 test
> properties/5 test users that predated this migration and had nothing to do with the real data
> being migrated here). `PANTHER_SEED_ENABLED=false` was used for this run so the bootstrap
> `DataSeeder` didn't create its own placeholder admin first — the seeder's email-upsert fallback
> exists as a safety net, not as the intended path.

## 6. Step-by-Step Checklist — ✅ all executed and verified

- [x] Write the extraction script and generate the JSON; hand-diff its record counts against the
      table in section 2. Result: every count matched except two, which turned out to be errors in
      this plan's original research pass, corrected in section 2 after independent re-verification
      by direct grep against `mockData.ts` — client materials is 15 (not 18), booking timeline
      events is 17 (not 21). Every other count matched exactly on the first try.
- [x] Apply every resolution in section 3 during extraction — all confirmed live post-migration (see
      spot-checks below): client-03/client-04/client-05 all show the correct re-derived
      `currentPropertyId`; the 3 pending-client bookings correctly have no linked client; the admin
      user shows `employeeId: 2` (linked to emp-02); exp-05/exp-06 attributed to properties 1/2
      respectively per decisions in section 7.
- [x] Precompute the BCrypt hash for `password@123` — done via the app's own real
      `BCryptPasswordEncoder` bean (a temporary throwaway JUnit test, deleted immediately after
      generating the hash, rather than a separate library, to guarantee exact compatibility).
- [x] Build the Java seeder (`LegacySeedRunner`) per the revised architecture in section 5.
- [x] Peer-reviewed the seeder code by hand before running it against real data.
- [x] Ran against a fresh, empty local Postgres (the project's own `docker-compose.yml` `db`
      service, reset first — see section 5's execution note) and confirmed `mvn verify`'s full
      148-test suite still passes unaffected afterward.
- [x] Verified record counts two ways — the seeder's own summary log line, and independent direct
      `SELECT count(*)` queries against Postgres — both matched section 2's table exactly:
      2 properties, 4 buildings, 4 rental types (23 included materials), 10 rooms, 6 clients (15
      materials), 5 bookings (17 timeline events), 10 payments, 6 expenses, 7 recurring bills, 5
      technicians (4 work orders, 3 documents), 8 preventive tasks, 3 damage reports, 4 water
      meters (16 history rows), 5 employees (7 documents, 7 daily tasks, 1 damage), 4 payroll
      records, 3 agents (7 deals), 3 maintenance issues, 6 activity logs, 7 notifications
      (12 recipient rows), 5 users.
- [x] Spot-checked cross-references via the live API: property 1's occupancy is now
      `totalRooms=7, occupied=4, available=2, maintenance=1, reserved=0` and property 2's is
      `totalRooms=3, occupied=2, available=1` — both computed live from real room statuses, and
      both internally consistent (every `OCCUPIED` room has a `currentClientId`, every
      `AVAILABLE`/`MAINTENANCE` room doesn't). Rooms 5 and 10 (the D1/D2 decisions) show
      `OCCUPIED` with `currentClientId` 4 and 5 respectively, confirming both fixes applied.
      Payments/expenses referencing the fixed dangling-property-id records all show the corrected
      `propertyId` (1 or 2, never a nonexistent id).
- [x] Confirmed computed/derived fields are now smaller and internally consistent, not the mock's
      vanity numbers: technician 1 shows `totalJobs=2` (was 78 in the mock), technician 2 shows
      `totalJobs=2` (was 92); agents show `clientsReferred`/`bookingsCount` of 4/2, 2/2, 1/1 (down
      from the mock's 18/14 etc.) — all now derived from the real seeded child records, exactly the
      expected/correct behavior per issue #7, not a regression.
- [x] Logged in as all 5 migrated users with `password@123` — all 5 succeeded (HTTP 200, correct
      role and name returned): operations@panther.rw (Eric Manzi, OPERATIONS), owner@panther.rw
      (Hon. Alexis Gatete, OWNER), jp.ndahiro@gmail.com (Jean-Paul Ndahiro, CLIENT),
      emmanuel.h@panther.rw (Emmanuel Habimana, HOUSEHOLD), admin@panther.rw (Diane Umutoni, ADMIN).
- [x] This local Postgres (`panther-pms-db`, the project's actual dev database) **is** the real
      target environment for this app's current stage — no separate "real" environment exists yet.
      The migrated data now lives in that database's persistent volume going forward.

## 7. Open Decisions Requiring Confirmation

These records describe real tenants with contradictory data in the source file — only the property
manager can give final confirmation. Unlike the first draft of this plan (which defaulted to
trusting the room's state), reading both sides of each contradiction directly changed the default:
in both D1 and D2, the *client* record carries specific, dated, financially-consistent evidence
(exact rent/deposit/rental-type matches, assigned materials with real dates) that a fabricated or
stale record would be very unlikely to have by coincidence — the room's `status` field looks like
the side that was simply never updated when the tenant moved in. If either default is wrong, it's a
one-row correction after import (`PATCH /clients/{id}` + `PATCH /rooms/{id}`), not a re-migration.

- **D1 — client-05 / room-10**: `client-05`'s rent (2200), deposit (2200), and rental type
  (Executive Luxury) all match room-10's real values exactly, and it has two dated assigned
  materials from its claimed move-in date (2026-02-01). Only the room number ("VC-12" vs room-10's
  real "G-401") and property name ("Vision City Executive Villas", which doesn't exist) are stale
  labels. **Default: import client-05 as the current tenant of room-10**, setting
  `room-10.status = occupied` and `current_client_id = client-05` to match — i.e. fix the room, not
  discard the tenancy. *Confirm: is client-05 (Marcus Thorne) actually a current tenant, and is
  room-10 (Nyarutarama Golf View Lofts, G-401) the correct real room?*
- **D2 — client-04 / room-05**: `client-04`'s room number ("A-404"), rent (700), and deposit (700)
  all match room-05 exactly, plus a dated assigned material from its claimed move-in date
  (2026-03-01). Room-05's own description text ("reserved for incoming diplomatic tenant") is even
  consistent with a tenant having since moved in without the room record being updated. **Default:
  import client-04 as the current tenant of room-05**, setting `room-05.status = occupied` and
  `current_client_id = client-04`. *Confirm: is client-04 (Claire Uwase) actually a current tenant
  of room-05?*
- **D3 — exp-06 / "Vision City Executive Villas"**: this expense uses the same fictional property
  name as `client-05`/`pay-06`, which both resolve to prop-02 (Nyarutarama Golf View Lofts) via
  `room-10`. `Expense` has no `roomId` to cross-check directly, so this is a reasoned inference from
  the shared naming, not a hard cross-reference. **Default: attribute `exp-06` to prop-02.**
  *Confirm: was this pool-maintenance expense ($520) actually for a Nyarutarama Golf View Lofts
  property, or a different property entirely?*

## 8. Explicitly Not Migrated (Nothing To Migrate)

- `system_settings` — no mock data exists for this table at all; seed one sensible default row
  (matching what `DataSeeder` already does for a fresh install) rather than leaving it empty, since
  the schema expects exactly one row.
- `notification_preferences` — no mock data exists; leave empty, each user gets the defaults
  documented in `BACKEND_PLAN.md` §5.1 the first time they touch their own preferences.
- `bill_payments`, employee `leaves`, and client `documents` — zero records of each in the source
  file; nothing to carry over (confirmed by exhaustive grep, not just "none found in the samples
  checked").
