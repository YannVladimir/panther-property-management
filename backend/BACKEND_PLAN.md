# Panther PMS — Backend Development Plan (Java Spring Boot)

> **Status:** Section 9 decisions confirmed. Phase 0 (bootstrap), Phase 1's core slice (IAM & security), Phase 2 (property domain), Phase 3 (leasing & CRM), Phase 4 (finance), Phase 5 (facilities & maintenance), Phase 6 (HR), and Phase 7 (platform) are implemented, compiled, packaged, and smoke-tested end-to-end. See `README.md` in this directory for exact status and how to run it. Phase 8 (hardening) not started.
> **Source of truth analyzed:** `frontend/src/types/index.ts`, `frontend/src/context/DataContext.tsx`, `frontend/src/context/AuthContext.tsx`, `frontend/src/routes/AppRoutes.tsx`, all 45 pages under `frontend/src/pages/**`, and `frontend/src/data/mockData.ts`.
> **Goal of this document:** Guarantee that **every piece of information the frontend displays or mutates** has a home in the database and an endpoint in the API. Section 7 is the traceability matrix that proves this page‑by‑page.

---

## 1. System Overview

**Panther PMS** is a multi-role property management platform (estates / rooms for rent, East-Africa market). Six roles, five authenticated portals + one public site:

| Role (enum `UserRole`) | Portal prefix | Summary |
|---|---|---|
| `public` | `/` | Anonymous browsing + booking inquiry + login |
| `client` | `/client/*` | Tenant self-service (lease, rent, materials, tickets) |
| `operations` | `/operations/*` | Day-to-day PM: bookings, clients, finance, HR, maintenance |
| `owner` | `/owner/*` | Read-only executive BI / portfolio analytics |
| `household` | `/household/*` | Field staff: checklists, tasks, payslips |
| `admin` | `/admin/*` | RBAC, property/room/rental-type CRUD, system settings |

The frontend currently runs on **mock data held in React Context** (`DataContext.tsx`). That context's state shape *is* the data model, and its ~50 mutator functions (`addBooking`, `updateBookingStatus`, `recordWaterMeterPayment`, …) *are* the required API operations. This plan turns each one into a real REST endpoint backed by a real table.

---

## 2. Proposed Tech Stack

| Concern | Choice | Notes |
|---|---|---|
| Language / runtime | Java 21 (LTS) | |
| Framework | Spring Boot 3.3.x | |
| Build tool | Maven | (Gradle acceptable alternative — confirm preference) |
| Web layer | Spring Web (REST, MVC) | |
| Security | Spring Security 6 + JWT (access + refresh token) | `jjwt` or Nimbus JOSE |
| Persistence | Spring Data JPA + Hibernate | |
| Database | PostgreSQL 16 | Enum-friendly, JSON support if ever needed, great with Flyway |
| Migrations | Flyway | Versioned SQL, no `ddl-auto` in prod |
| DTO mapping | MapStruct | Entity ↔ DTO, avoids leaking entities over the wire |
| Validation | Jakarta Bean Validation (`spring-boot-starter-validation`) | |
| API docs | springdoc-openapi (Swagger UI) | |
| File storage | Local disk (dev) → S3-compatible object storage / MinIO (prod) | Metadata row in DB, binary in object store |
| Query/filtering | Spring Data JPA Specifications (dynamic filters) | |
| Caching | Spring Cache + Caffeine (dashboards/reports) | Optional, phase 2 |
| Scheduling | Spring `@Scheduled` | Recurring bill due-date rollovers, leave status sync, overdue payment sweep |
| Testing | JUnit 5, Mockito, Testcontainers (Postgres), Spring Boot Test | |
| Containerization | Docker + Docker Compose (app + Postgres + MinIO) | |
| Observability | Spring Boot Actuator, structured logging (Logback JSON) | |

**Open decision for you (see Section 9):** Postgres vs MySQL — the frontend README draft used MySQL-flavored SQL; this plan defaults to **PostgreSQL** for better enum/array support with Hibernate. Say the word and we switch.

---

## 3. High-Level Architecture

```
┌──────────────────────────┐        HTTPS/JSON        ┌───────────────────────────────────────┐
│  React + TS Frontend      │ ───────────────────────▶ │        Spring Boot API (this plan)      │
│  (existing, unmodified)   │ ◀─────────────────────── │  /api/v1/**                              │
└──────────────────────────┘        JWT bearer         │                                           │
                                                        │  controller → service → repository      │
                                                        │  security (JWT filter + @PreAuthorize)   │
                                                        │  DTO (MapStruct) ↔ Entity (JPA)          │
                                                        └───────────────────┬───────────────────────┘
                                                                            │
                                                          ┌─────────────────┼─────────────────┐
                                                          ▼                 ▼                 ▼
                                                 ┌────────────────┐ ┌─────────────┐ ┌──────────────────┐
                                                 │ PostgreSQL 16  │ │ Object store │ │ Scheduler jobs    │
                                                 │ (Flyway-driven)│ │ (S3/MinIO)   │ │ (bills, leaves…)  │
                                                 └────────────────┘ └─────────────┘ └──────────────────┘
```

### Package layout (single Maven module, package-by-domain)

```
com.panther.pms
 ├─ config/            (Security, JWT, CORS, OpenAPI, Web, Scheduling)
 ├─ common/            (BaseEntity, GlobalExceptionHandler, PageResponse<T>, FileStorageService, audit/ — see note below)
 ├─ iam/                → users, auth, roles, system settings
 ├─ property/           → properties, buildings, rooms, rental types
 ├─ leasing/            → bookings, clients, client materials/documents, agents/commissions
 ├─ finance/            → payments, expenses, recurring bills, payroll
 ├─ facilities/         → technicians, work orders, preventive tasks, damage reports, water meters, maintenance issues
 ├─ hr/                 → employees, employee documents/tasks/damages/leaves
 └─ platform/           → notifications, dashboards/reports, global search, file uploads (+ read-only activity log controller)
```

**Deviation from the original layout (Phase 7):** the activity-log entity and `AuditService` live in `common.audit`, not `platform`, as originally sketched here. Every domain's services need to call `AuditService.log(...)`, but `platform.NotificationService` depends on `iam.User` for its broadcast fan-out — if `AuditService` stayed in `platform`, `iam` (and every other domain) would depend on `platform` while `platform` simultaneously depended back on `iam`, a circular package dependency. `common` already sits beneath every domain, so that's where the write path (and its table) live now; `platform` keeps the read-only `ActivityLogController`.

Each domain package internally follows: `controller/`, `service/`, `service/impl/`, `repository/`, `entity/`, `dto/`, `mapper/`.

---

## 4. Authentication & Authorization

- **Login:** `POST /api/v1/auth/login` with email + password → returns `{ accessToken, refreshToken, user }`. Access token TTL ~15 min, refresh TTL ~7 days (stored httpOnly cookie or returned to client per your preference).
- **JWT claims:** `sub` (user id), `role`, `clientId`/`employeeId` (if applicable), `name`.
- Every controller method is annotated `@PreAuthorize("hasRole('OPERATIONS')")` etc.; a **permission matrix** (Section 4.1) drives this.
- **Row-level scoping:**
  - `client` role: can only read/write records where `clientId == principal.clientId` (own bookings, payments, materials, issues, notifications).
  - `household` role: can only read/write own `employeeId`'s tasks/leaves/payroll/preventive tasks assigned to them.
  - `operations`/`admin`/`owner`: broader/global access per matrix below.
- Password reset / invite emails: stub an `EmailService` interface now, wire to a real provider (SendGrid/SES) later — the "Send Password Reset" / "Resend Invite" buttons in `AdminUsersRolesPage` need this.
- `public` role needs **no token** for browsing (`/properties`, `/property/:id`, `/room/:id`) and for submitting a booking inquiry (`POST /api/v1/bookings` open endpoint, rate-limited).

### 4.1 Permission matrix (by domain)

| Domain | public | client | household | operations | owner | admin |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Properties/Rooms — read | ✅ (published only) | ✅ | – | ✅ | ✅ | ✅ |
| Properties/Rooms/Buildings — write | – | – | – | – | – | ✅ |
| Rental Types — read | ✅ | ✅ | – | ✅ | ✅ | ✅ |
| Rental Types — write | – | – | – | – | – | ✅ |
| Bookings — create | ✅ (self) | ✅ (self) | – | ✅ | – | – |
| Bookings — manage (status/assign) | – | – | – | ✅ | – | – |
| Clients — read/write | – | own record only | – | ✅ | read-only | – |
| Payments — read | – | own only | – | ✅ | read-only | – |
| Payments — create | – | – | – | ✅ | – | – |
| Expenses / Recurring Bills | – | – | – | ✅ | read-only | – |
| Technicians / Work Orders | – | – | – | ✅ | read-only | – |
| Preventive Tasks — read/update own | – | – | ✅ (assigned only) | ✅ (all) | read-only | – |
| Damage Reports | – | read own | – | ✅ | read-only | – |
| Water Meters | – | read own | – | ✅ | read-only | – |
| Maintenance Issues — create | – | ✅ (self) | – | ✅ | – | – |
| Maintenance Issues — manage | – | – | – | ✅ | – | – |
| Employees / Payroll / Leaves — self | – | – | ✅ (own) | ✅ (all) | – | – |
| Agents & Commissions | – | – | – | ✅ | read-only | – |
| Activity Log | – | – | – | ✅ | read-only | ✅ |
| Notifications | – | own | own | own | own | own |
| Users & Roles | – | – | – | – | – | ✅ |
| System Settings | – | – | – | read-only | read-only | ✅ |
| Dashboards/Reports | – | own KPIs | own KPIs | ✅ | ✅ (financial) | ✅ (system) |

---

## 5. Database Schema (Domain by Domain)

Design conventions used everywhere unless noted:
- Every table has `id BIGSERIAL PRIMARY KEY`, `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`.
- Every human-facing "number" the frontend already generates (`bookingNumber`, `invoiceNumber`, `ticketNumber`, `jobNumber`, `payrollNumber`) becomes a `VARCHAR UNIQUE` column, generated server-side by a `NumberGeneratorService` (sequence + year prefix), matching current frontend logic (`BK-2026-###`, `INV-2026-####`, etc.).
- Frontend arrays of strings (`amenities`, `images`, `utilitiesIncluded`, `rules`, `photos`, `certifications`) are normalized into **child tables** (not JSON columns) so they're queryable and referentially clean — this is the one deliberate improvement over the draft schema left in `frontend/README.md`.
- Snapshot/denormalized display fields the frontend expects on nested objects (e.g. `propertyName` on a `Room`, `clientName` on a `Payment`) are **not** stored as separate columns — they are joined and populated by the DTO/mapper layer at read time, to avoid update-anomalies. (Flag if you'd rather denormalize for read speed; can revisit post-MVP.)

### 5.1 IAM domain

**`users`**
| Column | Type | Notes |
|---|---|---|
| id | BIGSERIAL PK | |
| name | VARCHAR(255) NOT NULL | |
| email | VARCHAR(255) UNIQUE NOT NULL | |
| phone | VARCHAR(50) | |
| password_hash | VARCHAR(255) NOT NULL | BCrypt |
| role | VARCHAR(20) NOT NULL | enum: CLIENT, OPERATIONS, OWNER, HOUSEHOLD, ADMIN |
| avatar_url | TEXT | |
| title | VARCHAR(120) | job title / designation |
| client_id | BIGINT FK → clients.id NULL | set when role=CLIENT |
| employee_id | BIGINT FK → employees.id NULL | set when role=HOUSEHOLD/OPERATIONS staff |
| status | VARCHAR(20) DEFAULT 'ACTIVE' | ACTIVE / INACTIVE / SUSPENDED |
| last_login_at | TIMESTAMPTZ | |
| must_change_password | BOOLEAN DEFAULT true | for admin-created accounts |

**`system_settings`** *(single-row config table — new, not in frontend types but required by `AdminSystemSettingsPage`)*
| Column | Type | Notes |
|---|---|---|
| id | BIGSERIAL PK | always id=1 |
| company_name | VARCHAR(255) | "Panther Living Ltd" |
| currency_code | VARCHAR(10) | USD / RWF |
| water_rate_per_m3 | DECIMAL(6,2) | default for new water meters |
| default_agent_commission_pct | DECIMAL(5,2) | |
| vat_tax_rate_pct | DECIMAL(5,2) | |
| updated_by | BIGINT FK → users.id | |

**`notification_preferences`** *(from `ProfileSettingsPage` toggles — new)*
| Column | Type | Notes |
|---|---|---|
| user_id | BIGINT PK/FK → users.id | |
| email_notifications | BOOLEAN DEFAULT true | |
| sms_notifications | BOOLEAN DEFAULT true | |
| theme_preference | VARCHAR(10) | light / dark / system |

### 5.2 Property domain

**`properties`**
id, name, code (unique, server-generated from initials), location, neighborhood, city, address, total_rooms, occupied_rooms, available_rooms, reserved_rooms, maintenance_rooms *(these 5 counts are computed columns — see 5.2.1)*, description, rating, review_count, featured (bool), year_built, monthly_revenue_estimate, status (ACTIVE/MAINTENANCE/FULL).

- `property_images` (id, property_id FK, url, sort_order)
- `property_amenities` (id, property_id FK, amenity VARCHAR)

*5.2.1 — `occupiedRooms/availableRooms/reservedRooms/maintenanceRooms/totalRooms` are **derived** from `rooms.status` grouped by `property_id`. Plan: expose as a computed read model (`PropertyOccupancyView`), refreshed on read or cached, rather than columns the app must keep in sync manually — avoids drift bugs the frontend mock data already risks.*

**`buildings`**: id, property_id FK, name, floors_count, total_rooms (derived, same rationale).

**`rental_types`**: id, name (enum FurnishingType: FULLY_FURNISHED / SELF_FURNISHED / SEMI_FURNISHED / EXECUTIVE_LUXURY), description, price_multiplier, status (ACTIVE/INACTIVE).
- `rental_type_included_materials` (id, rental_type_id FK, name, quantity, condition, category) — the item *template*, distinct from a client's actual assigned `client_materials` row.
- `rental_type_applicable_properties` (rental_type_id FK, property_id FK) — many-to-many join.

**`rooms`**: id, property_id FK, building_id FK, room_number, floor, size_sq_m, bedrooms, bathrooms, furnishing_type (FK or enum matching rental_types.name), monthly_rent, deposit, status (AVAILABLE/RESERVED/OCCUPIED/MAINTENANCE), current_client_id FK → clients.id NULL, virtual_tour_url, description.
- `room_images`, `room_amenities`, `room_utilities_included`, `room_rules` — each `(id, room_id FK, value)`.

### 5.3 Leasing / CRM domain

**`clients`**: id, user_id FK NULL (if self-service login exists), name, email (unique), phone, avatar_url, identification_number (unique), nationality, occupation, employer, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, current_room_id FK NULL, current_property_id FK NULL, rental_type VARCHAR, move_in_date, lease_expiry_date, monthly_rent, deposit_paid, payment_status (PAID/PENDING/OVERDUE), status (ACTIVE/FORMER/INACTIVE/SUSPENDED), deactivation_reason, deactivated_date, notes.
- `client_materials` (id, client_id FK, rental_type_item_id FK NULL, name, quantity, condition ENUM(Excellent/Good/Fair/NeedsRepair), assigned_date, serial_number, category)
- `client_documents` (id, client_id FK, name, type ENUM(TenancyContract/NationalID/Passport/ProofOfIncome/WorkPermit/MoveInInventory/DepositGuarantee/Other), file_url, upload_date, size_label, status ENUM(Verified/PendingReview/Expired))

**`bookings`**: id, booking_number (unique, generated), client_id FK NULL *(nullable — a public/anonymous inquiry may precede a client account)*, client_name, client_email, client_phone *(snapshot fields for pre-account inquiries)*, property_id FK, room_id FK NULL, rental_type_id FK, requested_date, move_in_date, move_out_date, monthly_rent, deposit, status (9-value enum matching frontend `BookingStatus`), notes, source ENUM(ClientPortal/OperationsManager/WalkIn/PhoneInquiry/AgentReferral), agent_id FK NULL.
- `booking_timeline_events` (id, booking_id FK, status, occurred_at, note, updated_by_user_id FK)

**`agents`**: id, user_id FK NULL, name, agency, phone, email (unique), avatar_url, status (ACTIVE/INACTIVE), clients_referred, bookings_count, successful_rentals, commission_rate_pct, total_commission_earned, commission_paid, outstanding_commission, payment_method, payout_account, notes. *(referral counters and commission totals are maintained by the service layer on each deal write, not client-editable.)*
- `agent_deals` (id, agent_id FK, client_name, client_email, client_phone, property_id FK, room_id FK NULL, rental_type, monthly_rent, commission_percentage, commission_amount, deal_date, status ENUM(Paid/Pending/Processing), payout_date, payout_reference, notes)

### 5.4 Finance domain

**`payments`**: id, invoice_number (unique, generated), client_id FK, property_id FK, room_id FK, amount, payment_date, due_date, type ENUM(Rent/Deposit/Utility/Penalty/Maintenance/Other), method ENUM(MobileMoney/BankTransfer/CreditCard/Cash), reference, status ENUM(Paid/Pending/Overdue/Cancelled), receipt_url, notes.

**`expenses`**: id, property_id FK, category ENUM(9 values matching `ExpenseCategory`), description, amount, expense_date, vendor, payment_method, status ENUM(Paid/Pending), receipt_attached (bool), receipt_url, notes.

**`recurring_bills`**: id, property_id FK, name, category ENUM(Electricity/Water/Internet/Security/Cleaning/MaintenanceContract/GarbageCollection), vendor, amount, frequency ENUM(Monthly/Quarterly/BiWeekly/Annual), next_due_date, status ENUM(Paid/Upcoming/Overdue), auto_renew (bool), reminder_days.
- `bill_payments` (id, recurring_bill_id FK, paid_date, amount, method ENUM(MobileMoney/BankTransfer/Cash/Cheque), reference, notes, proof_url)

**`payroll_records`**: id, payroll_number (unique, generated), employee_id FK, period (VARCHAR "August 2026"), basic_salary, allowances, bonuses, deductions, tax_amount, net_salary, payment_date, payment_status ENUM(Paid/Processing/Pending), payment_method.

### 5.5 Facilities / Maintenance domain

**`technicians`**: id, name, company, contact, email, avatar_url, specialization ENUM(7 values), rating, availability ENUM(Available/OnJob/Unavailable), total_jobs (derived), total_paid (derived), hourly_rate, notes, address, national_id, emergency_contact_name/phone/relationship, preferred_payment_method, payout_account, years_experience.
- `technician_certifications` (id, technician_id FK, certification)
- `tech_documents` (id, technician_id FK, name, type ENUM(License/Certification/Contract/Insurance/ID/Invoice/Other), file_url, upload_date, expiry_date, status ENUM(Valid/Expired/PendingReview))
- `tech_work_orders`: id, job_number (unique, generated), technician_id FK, property_id FK, room_id FK NULL, title, description, category ENUM(Plumbing/Electrical/Carpentry/HVAC/Painting/ITSecurity/General), priority ENUM(Low/Medium/High/Emergency), dispatched_date, start_date, completed_date, estimated_hours, actual_hours, labor_cost, material_cost, total_cost (derived = labor+material), payment_status ENUM(Unpaid/PartiallyPaid/Paid), paid_amount, status ENUM(Dispatched/InProgress/Completed/Cancelled/OnHold), rating (1-5), rating_comment, notes.
  - `tech_work_order_photos` (id, work_order_id FK, url)

**`preventive_tasks`**: id, property_id FK, category ENUM(15 values matching `PreventiveCategory`), task_name, frequency ENUM(Weekly/BiWeekly/Monthly/Quarterly/Custom), schedule_week (1-4), assigned_staff_id FK → employees.id, status ENUM(Pass/Failed/NeedsAttention/NotApplicable/Pending), remarks, due_date, last_completed_date, resolved_date.
- `preventive_task_photos` (id, task_id FK, url)

**`damage_reports`**: id, property_id FK, room_id FK, client_id FK NULL, item, damage_type, description, reported_date, estimated_cost, amount_charged, responsible_party ENUM(Tenant/PropertyOwner/WearAndTear/Contractor), status ENUM(PendingReview/InRepair/Resolved/Disputed), resolution_notes.
- `damage_report_photos` (id, damage_report_id FK, url)

**`water_meters`**: id, property_id FK, room_id FK, client_id FK, meter_number (unique), previous_reading, current_reading, consumption_m3 (derived = current - previous), reading_date, rate_per_m3, total_amount (derived = consumption × rate), payment_status ENUM(Paid/Pending/Overdue).
- `water_meter_readings_history` (id, water_meter_id FK, period_month VARCHAR, reading, consumption, amount) — append-only ledger populated every billing cycle.

**`maintenance_issues`** *(tenant-reported tickets, distinct from technician work orders)*: id, ticket_number (unique, generated), client_id FK, property_id FK, room_id FK, category ENUM(Plumbing/Electrical/Furniture/Appliances/HVAC/Structural/Other), title, description, priority ENUM(Low/Medium/High/Emergency), status ENUM(Submitted/Reviewed/Assigned/InProgress/Resolved/Closed), reported_date, assigned_technician_id FK NULL, resolution_date, resolution_notes.
- `maintenance_issue_photos` (id, issue_id FK, url)

### 5.6 HR domain

**`employees`**: id, user_id FK NULL, name, avatar_url, position, department ENUM(Operations/Maintenance/Housekeeping/Security/Finance/Management), contact, email, employment_status ENUM(FullTime/PartTime/Contract), status ENUM(Active/OnLeave/Suspended/Terminated), status_reason, start_date, basic_salary, national_id (unique), emergency_contact_name/phone/relationship, address.
- `employee_documents` (id, employee_id FK, name, type ENUM(EmploymentContract/NationalIdPassport/CriminalRecordClearance/HealthInsurance/CertificateDegree/Other), file_url, upload_date, size_label, status ENUM(Verified/PendingReview/Expired))
- `employee_daily_tasks` (id, employee_id FK, title, description, assigned_date, due_date, priority ENUM(High/Medium/Low), property_id FK NULL, room_id FK NULL, status ENUM(Pending/InProgress/Completed/Rejected), completed_date, manager_comment, rating 1-5, rated_by_user_id FK)
- `employee_damages` (id, employee_id FK, incident_date, item, property_id FK NULL, room_id FK NULL, description, estimated_cost, deducted_from_salary bool, deducted_amount, status ENUM(Investigating/Deducted/Forgiven/Settled))
  - `employee_damage_photos` (id, employee_damage_id FK, url)
- `employee_leaves` (id, employee_id FK, leave_type ENUM(AnnualLeave/SickLeave/MaternityPaternity/CompassionateLeave/UnpaidLeave), start_date, end_date, days_count, reason, status ENUM(Approved/Pending/Completed/Cancelled), approved_by_user_id FK NULL, requested_date)

### 5.7 Platform domain

**`activity_logs`** *(append-only audit trail)*: id, occurred_at, user_id FK, user_name (snapshot), role, action, module, details, type ENUM(Info/Success/Warning/Critical). Written by an `AuditService` called from every mutating service method (mirrors every `addActivityLog(...)` call already in `DataContext.tsx`).

**`notifications`**: id, title, message, created_at, type ENUM(Booking/Payment/Maintenance/System/Payroll/Alert), link.
- `notification_target_roles` (notification_id FK, role) — broadcast targeting, same as frontend's `targetRoles[]`.
- `notification_recipients` (id, notification_id FK, user_id FK, read_at NULL) — **new, needed for real per-user "read" state** (the mock data only has a single global `read: boolean`, which doesn't scale past one demo user per role).

### 5.8 Full table count

**23 primary entity tables + ~20 child/join tables ≈ 43 tables total.** Full DDL will be delivered as versioned Flyway migrations (`V1__iam.sql`, `V2__property.sql`, …) during implementation, not hand-typed here — this section is the authoritative field-level spec those migrations are generated from.

---

## 6. REST API Catalog

Base path: `/api/v1`. All list endpoints support `page`, `size`, `sort`, and domain-specific filters; response shape:
```json
{ "content": [...], "page": 0, "size": 20, "totalElements": 142, "totalPages": 8 }
```

### 6.1 Auth & IAM
| Method | Path | Roles | Purpose |
|---|---|---|---|
| POST | `/auth/login` | public | Login, returns JWT pair |
| POST | `/auth/refresh` | public (refresh token) | New access token |
| POST | `/auth/logout` | authenticated | Invalidate refresh token |
| GET | `/auth/me` | authenticated | Current user profile |
| POST | `/auth/change-password` | authenticated | Self password change |
| POST | `/auth/forgot-password` | public | Trigger reset email |
| POST | `/auth/reset-password` | public (reset token) | Complete reset |
| GET | `/users` | admin | List/filter/search users |
| POST | `/users` | admin | Create user (+ send invite) |
| GET | `/users/{id}` | admin | Detail |
| PUT | `/users/{id}` | admin | Update profile/role |
| PATCH | `/users/{id}/status` | admin | activate/deactivate/suspend |
| POST | `/users/{id}/reset-password` | admin | Force-send reset link |
| POST | `/users/{id}/resend-invite` | admin | Resend invite email |
| DELETE | `/users/{id}` | admin | Hard delete |
| PATCH | `/users/me/preferences` | authenticated | theme/email/sms toggles |
| GET | `/settings` | operations, owner, admin | Read system settings |
| PUT | `/settings` | admin | Update system settings |

### 6.2 Property domain
| Method | Path | Roles | Purpose |
|---|---|---|---|
| GET | `/properties` | public/all | List (public sees only ACTIVE + published fields) |
| GET | `/properties/{id}` | public/all | Detail incl. rooms summary |
| POST | `/properties` | admin | Create |
| PUT | `/properties/{id}` | admin | Update |
| DELETE | `/properties/{id}` | admin | Delete (blocked if rooms occupied) |
| POST | `/properties/{id}/images` | admin | Upload/attach photo |
| DELETE | `/properties/{id}/images/{imgId}` | admin | Remove photo |
| GET | `/properties/{id}/buildings` | all | List buildings |
| POST | `/buildings` | admin | Create building |
| PUT/DELETE | `/buildings/{id}` | admin | Update/delete |
| GET | `/rooms` | public/all | List/filter (property, status, furnishing, price range) |
| GET | `/rooms/{id}` | public/all | Detail |
| POST | `/rooms` | admin | Create |
| PUT | `/rooms/{id}` | admin | Update |
| PATCH | `/rooms/{id}/status` | operations, admin | Change availability status |
| DELETE | `/rooms/{id}` | admin | Delete |
| GET | `/rental-types` | all | List |
| POST | `/rental-types` | admin | Create (+ included materials template) |
| PUT | `/rental-types/{id}` | admin | Update |
| DELETE | `/rental-types/{id}` | admin | Delete |

### 6.3 Leasing / CRM
| Method | Path | Roles | Purpose |
|---|---|---|---|
| GET | `/bookings` | operations | List/filter by status/property/date |
| POST | `/bookings` | public, client, operations | Create booking request |
| GET | `/bookings/{id}` | operations, owning client | Detail + timeline |
| PATCH | `/bookings/{id}/status` | operations | Approve/reject/confirm/etc. |
| PATCH | `/bookings/{id}/assign-room` | operations | Assign room → also flips room to RESERVED |
| GET | `/clients/me/bookings` | client | My booking status ("My Booking" page) |
| GET | `/clients` | operations | List/filter/search tenants |
| POST | `/clients` | operations | Register new resident |
| GET | `/clients/{id}` | operations, owning client | Full dossier |
| PUT | `/clients/{id}` | operations | Update profile |
| PATCH | `/clients/{id}/status` | operations | activate/suspend/deactivate/mark-former |
| GET/POST | `/clients/{id}/documents` | operations (write), owning client (read) | Contracts, ID, etc. |
| DELETE | `/clients/{id}/documents/{docId}` | operations | |
| GET/POST | `/clients/{id}/materials` | operations (write), owning client (read) | Move-in inventory |
| PATCH | `/clients/{id}/materials/{matId}/condition` | operations, owning client | Condition update |
| DELETE | `/clients/{id}/materials/{matId}` | operations | |
| GET | `/clients/me` | client | "My Room" self profile |
| GET | `/agents` | operations | List brokers |
| POST | `/agents` | operations | Register broker |
| PUT | `/agents/{id}` | operations | Update |
| GET/POST | `/agents/{id}/deals` | operations | Commission deals |
| POST | `/agents/{id}/pay-commission` | operations | Disburse payout |

### 6.4 Finance
| Method | Path | Roles | Purpose |
|---|---|---|---|
| GET | `/payments` | operations | Ledger, filters: client/property/status/type/date |
| POST | `/payments` | operations | Record payment / generate invoice |
| GET | `/payments/{id}` | operations, owning client | Detail |
| GET | `/payments/{id}/receipt` | operations, owning client | Download receipt |
| GET | `/clients/me/payments` | client | My rent/utility history |
| GET/POST | `/expenses` | operations | List / log expense |
| PUT/DELETE | `/expenses/{id}` | operations | |
| GET/POST | `/recurring-bills` | operations | Vendor contracts |
| PUT/DELETE | `/recurring-bills/{id}` | operations | |
| POST | `/recurring-bills/{id}/payments` | operations | Log a bill payment |
| PATCH | `/recurring-bills/{id}/mark-paid` | operations | Quick mark-paid |
| GET/POST | `/payroll-records` | operations | Generate/list payslips |
| GET | `/employees/{id}/payroll` | operations | History for one employee |
| GET | `/employees/me/payroll` | household | "My Salary" payslips |

### 6.5 Facilities & Maintenance
| Method | Path | Roles | Purpose |
|---|---|---|---|
| GET/POST | `/technicians` | operations | Contractor directory |
| GET/PUT | `/technicians/{id}` | operations | Profile |
| GET/POST | `/technicians/{id}/work-orders` | operations | Dispatch job |
| PUT | `/technicians/{id}/work-orders/{woId}` | operations | Update job (progress, cost, rating) |
| GET/POST | `/technicians/{id}/documents` | operations | Licenses/certs |
| GET | `/preventive-tasks` | operations | All routines, filter by property |
| GET | `/employees/me/preventive-tasks` | household | My assigned checklist |
| POST | `/preventive-tasks` | operations | Schedule new routine |
| PATCH | `/preventive-tasks/{id}/status` | operations, assigned household staff | Submit inspection result + photos |
| GET/POST | `/damages` | operations | Damage register |
| PUT | `/damages/{id}` | operations | Update |
| PATCH | `/damages/{id}/status` | operations | Resolve/dispute |
| GET | `/water-meters` | operations | All meters, tenants-with-active-lease first |
| GET | `/clients/me/water-meter` | client | My consumption/history |
| POST | `/water-meters` | operations | Assign new meter to client |
| PATCH | `/water-meters/{id}/reading` | operations | Record reading → computes consumption/bill |
| POST | `/water-meters/{id}/payment` | operations | Settle bill |
| GET | `/water-meters/{id}/history` | operations, owning client | Consumption trend |
| GET | `/maintenance-issues` | operations | Tenant ticket queue |
| POST | `/maintenance-issues` | client | Report issue (+ photos) |
| GET | `/clients/me/maintenance-issues` | client | My tickets |
| PATCH | `/maintenance-issues/{id}/status` | operations | Assign technician / resolve |

### 6.6 HR
| Method | Path | Roles | Purpose |
|---|---|---|---|
| GET/POST | `/employees` | operations | Staff directory |
| GET/PUT | `/employees/{id}` | operations | Dossier |
| PATCH | `/employees/{id}/status` | operations | active/on_leave/suspended/terminated |
| GET/POST | `/employees/{id}/documents` | operations | Compliance docs |
| DELETE | `/employees/{id}/documents/{docId}` | operations | |
| GET/POST | `/employees/{id}/daily-tasks` | operations | Assign task |
| PATCH | `/employees/{id}/daily-tasks/{taskId}` | operations, assigned household staff (status/self-update only) | Progress/rating |
| GET/POST | `/employees/{id}/damages` | operations | Equipment damage incident |
| GET/POST | `/employees/{id}/leaves` | operations, household (self, create request) | Leave request |
| PATCH | `/employees/{id}/leaves/{leaveId}` | operations | Approve/reject → auto status sync |
| GET | `/employees/me` | household | My HR profile |
| GET | `/employees/me/daily-tasks` | household | Today's tasks (dashboard + checklist) |
| GET | `/employees/me/history` | household | Completed task history |

### 6.7 Platform
| Method | Path | Roles | Purpose |
|---|---|---|---|
| GET | `/activity-logs` | operations, admin (read), owner (read) | Filter by module/type/date |
| GET | `/notifications/me` | authenticated | My feed (role + user targeted) |
| PATCH | `/notifications/{id}/read` | authenticated | Mark one read |
| PATCH | `/notifications/read-all` | authenticated | Mark all read |
| POST | `/notifications` | operations, admin | Broadcast to role(s) |
| GET | `/search?q=` | operations, admin, owner | Global search modal (properties, clients, bookings, employees, technicians) |
| GET | `/dashboard/operations` | operations | KPI aggregate for Ops dashboard |
| GET | `/dashboard/owner` | owner | Executive BI KPIs (NOI, occupancy, ROI) |
| GET | `/dashboard/admin` | admin | System health, user counts |
| GET | `/dashboard/client` | client | Lease overview, next due date, open tickets |
| GET | `/dashboard/household` | household | Today's tasks, rating summary |
| GET | `/reports/revenue-expense` | operations, owner | Chart data |
| GET | `/reports/occupancy` | operations, owner | Chart data |
| GET | `/reports/property-performance` | operations, owner | Chart data |
| GET | `/reports/water-consumption` | operations | Chart data |
| GET | `/reports/export` | operations, owner | CSV/PDF export |
| POST | `/files/upload` | authenticated | Generic upload (photos, documents, receipts, proofs) → returns URL + metadata |

---

## 7. Frontend Coverage Matrix — proof nothing is missed

Every page group is mapped to the entities it touches and the endpoints that serve it. This is the checklist to re-verify against once the frontend is wired to the real API (swap `DataContext`'s mock state for API calls).

| Page(s) | Entities / Tables | Endpoints |
|---|---|---|
| `HomePage`, `PropertiesPage`, `PropertyDetailPage`, `RoomDetailPage` | properties, property_images, property_amenities, buildings, rooms, room_* | `GET /properties`, `GET /properties/{id}`, `GET /rooms`, `GET /rooms/{id}` |
| `LoginPage` | users | `POST /auth/login` |
| `ClientDashboard` | clients, bookings, payments, maintenance_issues, notifications | `GET /dashboard/client` |
| `MyBookingPage` | bookings, booking_timeline_events | `GET /clients/me/bookings` |
| `MyRoomPage` | clients, rooms, room_amenities/utilities/rules | `GET /clients/me` |
| `ClientPaymentsPage` | payments | `GET /clients/me/payments` |
| `MyMaterialsPage` | client_materials | `GET /clients/{id}/materials`, `PATCH .../condition` |
| `ReportIssuePage` | maintenance_issues, maintenance_issue_photos | `POST /maintenance-issues`, `POST /files/upload` |
| `ClientNotificationsPage` (reused by every role) | notifications, notification_recipients | `GET /notifications/me`, `PATCH /notifications/{id}/read` |
| `OperationsDashboard` | properties, bookings, payments, recurring_bills, employee_daily_tasks | `GET /dashboard/operations` |
| `BookingsManagementPage` | bookings, booking_timeline_events, clients, rooms | `GET/POST /bookings`, `PATCH /bookings/{id}/status`, `PATCH /bookings/{id}/assign-room` |
| `ClientsManagementPage`, `ClientDetailPage` | clients, client_documents, client_materials, payments, maintenance_issues, water_meters, damage_reports | `GET/POST/PUT /clients`, `PATCH /clients/{id}/status`, docs/materials sub-resources |
| `PropertiesManagementPage` | properties, rooms (occupancy aggregates) | `GET /properties`, `GET /rooms` |
| `PaymentsManagementPage` | payments | `GET/POST /payments` |
| `AgentsCommissionsPage` | agents, agent_deals | `GET/POST /agents`, `GET/POST /agents/{id}/deals`, `POST /agents/{id}/pay-commission` |
| `ExpensesPage` | expenses | `GET/POST/PUT/DELETE /expenses` |
| `RecurringBillsPage` | recurring_bills, bill_payments | `GET/POST /recurring-bills`, `POST /recurring-bills/{id}/payments`, `PATCH .../mark-paid` |
| `TechniciansPage` | technicians, technician_certifications, tech_work_orders, tech_work_order_photos, tech_documents | `GET/POST /technicians`, `.../work-orders`, `.../documents` |
| `PreventiveMaintenancePage` | preventive_tasks, preventive_task_photos, employees | `GET/POST /preventive-tasks`, `PATCH .../status` |
| `DamagesManagementPage` | damage_reports, damage_report_photos | `GET/POST/PUT /damages`, `PATCH .../status` |
| `WaterMetersPage` | water_meters, water_meter_readings_history, clients, payments | `GET/POST /water-meters`, `PATCH .../reading`, `POST .../payment`, `GET .../history` |
| `HRPayrollPage`, `EmployeeDetailPage` | employees, employee_documents, employee_daily_tasks, employee_damages, employee_damage_photos, employee_leaves, payroll_records | full `/employees/**` + `/payroll-records` set |
| `ActivityLogPage` | activity_logs | `GET /activity-logs` |
| `ReportsPage` | payments, expenses, properties, rooms, water_meters (aggregated) | `GET /reports/*` |
| `OwnerExecutiveDashboard` | properties, payments, expenses, rooms, clients | `GET /dashboard/owner` |
| `HouseholdDashboard` | employee_daily_tasks, employees | `GET /dashboard/household` |
| `HouseholdChecklistPage` | preventive_tasks (assigned to me), preventive_task_photos | `GET /employees/me/preventive-tasks`, `PATCH /preventive-tasks/{id}/status` |
| `HouseholdTaskHistoryPage` | employee_daily_tasks (completed), preventive_tasks (history) | `GET /employees/me/history` |
| `HouseholdSalaryPage` | payroll_records | `GET /employees/me/payroll` |
| `AdminDashboard` | users, activity_logs, properties (counts) | `GET /dashboard/admin` |
| `AdminPropertiesPage`, `AdminPropertyEditPage` | properties, property_images, property_amenities | `GET/POST/PUT/DELETE /properties`, `.../images` |
| `AdminBuildingsRoomsPage`, `AdminRoomEditPage` | buildings, rooms, room_* | `GET/POST/PUT/DELETE /buildings`, `/rooms` |
| `AdminRentalTypesPage` | rental_types, rental_type_included_materials, rental_type_applicable_properties | `GET/POST/PUT/DELETE /rental-types` |
| `AdminUsersRolesPage` | users | full `/users/**` set |
| `AdminSystemSettingsPage` | system_settings | `GET/PUT /settings` |
| `ProfileSettingsPage` (all roles) | users, notification_preferences | `PATCH /users/me/preferences`, `POST /auth/change-password` |
| `GlobalSearchModal` (shared component) | properties, clients, bookings, employees, technicians | `GET /search?q=` |
| `FinancialCalendar` (shared component) | recurring_bills, payments (due dates) | reuses `/recurring-bills`, `/payments` list filters |

✅ **Every table in Section 5 is referenced by at least one row above. Every page in `AppRoutes.tsx` is referenced by at least one row above.**

---

## 8. Cross-Cutting Concerns

- **Business-key generation:** central `NumberGeneratorService` for `BK-YYYY-###`, `INV-YYYY-####`, `TKT-YYYY-###`, `WO-#####`, `PAY-YYYY-MM-###` — backed by a Postgres sequence per prefix, not `random()`, to guarantee uniqueness under concurrency (the current frontend mock uses `Date.now()` + `Math.random()`, which is not safe for a real backend).
- **Derived fields:** occupancy counts, work-order `totalCost`, water-meter `consumption`/`totalAmount`, agent commission totals — computed in the service layer on write (or as SQL views for dashboards), never trusted from client input.
- **State-machine side effects** (ported from `DataContext.tsx`, now server-enforced instead of client-enforced):
  - `assignRoomToBooking` → booking status `room_assigned` **and** room status `RESERVED`.
  - Booking `checked_in` → room status `OCCUPIED`, `clients.current_room_id` set.
  - Booking `completed` (move-out) → room status `AVAILABLE`, client status `FORMER`.
  - `addPayment(type=rent, status=paid)` → `clients.payment_status = PAID`.
  - `recordWaterMeterPayment` → auto-creates a linked `payments` row (type=UTILITY).
  - `addAgentDeal` → increments agent's `successfulRentals`/`clientsReferred`/commission totals.
  - `addEmployeeLeave(status=Approved)` / date-crossing → `employees.status` flips `ACTIVE ⇄ ON_LEAVE` (a nightly `@Scheduled` job also sweeps end-dated leaves back to `ACTIVE`).
  - Every mutating action writes an `activity_logs` row (replaces the manual `addActivityLog(...)` calls sprinkled through `DataContext.tsx` with a single AOP-based `@Audited` annotation or explicit service-layer call).
- **File uploads:** one shared `POST /files/upload` (multipart) used by client documents, employee documents, technician documents, damage/issue/preventive-task photos, work-order photos, payment receipts, bill payment proofs. Returns `{ url, sizeLabel, contentType }`; the calling endpoint then links that URL into its own child table.
- **Pagination/filtering convention:** Spring Data `Pageable` + JPA Specifications for every list endpoint listed with "List/filter" in Section 6.
- **Validation & errors:** Jakarta Bean Validation on DTOs; `@ControllerAdvice` global handler → consistent `{ timestamp, status, error, message, path, fieldErrors[] }` payload.
- **Notifications delivery (phase 1):** DB-stored + polled via `GET /notifications/me`. Phase 2 candidate: WebSocket/SSE push — not required for MVP parity with the current frontend (which also just polls context state).
- **Scheduled jobs:** recurring-bill `UPCOMING → OVERDUE` sweep, payment `PENDING → OVERDUE` sweep, leave-status sync, (optional) reminder notifications N days before `recurring_bills.next_due_date` per `reminder_days`.
- **API versioning:** all routes under `/api/v1`; breaking changes get `/api/v2` rather than mutating v1.
- **CORS:** allow the Vite dev origin (and later prod frontend origin) explicitly — never `*` once auth cookies/tokens are in play.

---

## 9. Open Decisions

**Confirmed:**

1. **Database engine:** ✅ PostgreSQL.
2. **Build tool:** ✅ Maven.
3. **Token transport:** ✅ JWT returned in the JSON response body (`{ accessToken, refreshToken, user }`).
4. **File storage for MVP:** ✅ Local disk (`panther.file-storage.base-dir`, defaults to `./uploads`). `FileStorageService` is an interface — swapping in an S3/MinIO implementation later doesn't touch any calling code.

**Still open — defaulted for now, revisit before the relevant phase:**

5. **Payments:** defaulted to manual recording only (as today, no live gateway) until you say otherwise — affects Phase 4.
6. **Multi-currency:** defaulted to the single global currency toggle already in `system_settings` — affects Phase 2 onward if it changes.
7. **Denormalized snapshot fields** (e.g. `propertyName` on `Room`): defaulted to computing via JOIN at read time (safer, avoids drift) — affects Phase 2–6 entity design.
8. **Email/SMS provider:** defaulted to a stub (`EmailService` interface + `LoggingEmailService` that logs to console) — affects Phase 1 hardening and any phase sending notifications.

---

## 10. Implementation Roadmap & Checklist

### Phase 0 — Project Bootstrap
- [x] Confirm open decisions in Section 9
- [x] Initialize Spring Boot project (Web, Security, Data JPA, Validation, Postgres driver, Flyway)
- [x] Set up package skeleton per Section 3 (`iam` implemented; `property`/`leasing`/`finance`/`facilities`/`hr`/`platform` scaffolded with `package-info.java`)
- [x] Configure `application.yml` (dev/prod profiles; `test` profile deferred to when Testcontainers-based tests are written)
- [x] Set up Docker Compose: `app`, `postgres` (no MinIO — local disk chosen instead)
- [x] Configure Flyway baseline + migration naming convention (`V1__iam.sql`)
- [x] Set up springdoc-openapi (Swagger UI at `/swagger-ui.html`) — verified reachable
- [x] Set up global exception handler + standard error response DTO
- [ ] Set up CI pipeline skeleton (build + test on push) — not started

### Phase 1 — IAM & Security Foundation
- [x] `users` table + entity + repository
- [x] `system_settings`, `notification_preferences` tables
- [x] Spring Security config: JWT filter, password encoder, role-based method security
- [x] `POST /auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/me` — smoke-tested live
- [x] `POST /auth/change-password`, forgot/reset password flow (email stub via `LoggingEmailService`)
- [x] `/users/**` CRUD + status transitions + reset/resend-invite (admin) — create/list smoke-tested live
- [x] `/settings` GET/PUT (admin) — smoke-tested live
- [x] Seed default admin user + default system settings row (via `DataSeeder` `ApplicationRunner`, not a raw SQL seed — avoids committing a password hash to source control)
- [x] Unit + integration tests for auth flows and role guards — `AuthFlowIT` (login, refresh,
      `/auth/me`, change-password) and `RoleAccessMatrixIT` (full permission matrix), both added
      in Phase 8

### Phase 2 — Property Domain
- [x] `properties`, `property_images`, `property_amenities` tables + CRUD API
- [x] `buildings` table + CRUD API
- [x] `rooms` + `room_images/amenities/utilities/rules` tables + CRUD API
- [x] `rental_types` + `rental_type_included_materials` + `rental_type_applicable_properties` + CRUD API
- [x] Occupancy aggregate read model (computed counts per property, single grouped query — not N+1)
- [x] Public (unauthenticated) read endpoints — property LIST filters to `ACTIVE` only for anonymous callers, and a direct GET of a non-`ACTIVE` property 404s for anonymous callers instead of leaking it
- [x] Guard rails: can't delete a property/building that still has rooms (409); a room's `buildingId` must belong to its `propertyId` (400) — smoke-tested live
- [ ] Room status transition guard beyond the above (e.g. blocking edits to a currently-leased room's core terms) — deferred until Phase 3 introduces the client/lease relationship that would make "occupied" meaningful to guard against
- [ ] Automated tests (Testcontainers) — manual smoke test done live (property/room/rental-type CRUD, occupancy math, public-visibility filtering, delete guards, cross-property validation all verified); no dedicated automated suite yet (only indirectly exercised as fixture setup in Phase 8's `BookingLifecycleIT`/`WaterMeterBillingIT`/`RoleAccessMatrixIT`)

### Phase 3 — Leasing & CRM
- [x] `clients`, `client_documents`, `client_materials` tables + API
- [x] `bookings`, `booking_timeline_events` tables + API
- [x] Booking state machine + side effects — smoke-tested live: `assignRoomToBooking` → room `RESERVED`; `CHECKED_IN` → room `OCCUPIED` + client's `currentRoom` set; `COMPLETED` → room `AVAILABLE` + client → `FORMER`
- [x] `agents`, `agent_deals` tables + API + commission math — `clientsReferred`/`bookingsCount`/`successfulRentals`/`totalCommissionEarned`/`commissionPaid`/`outstandingCommission` all computed at read time from `bookings`/`agent_deals` (no stored counters to drift), verified live including a full commission-payout cycle
- [x] Public (unauthenticated) booking inquiry endpoint — `POST /bookings` open to anonymous visitors, verified live
- [x] Row-level scoping: client can only see/edit own booking/materials/documents (`/clients/{id}`, `/bookings/{id}` via `@PostAuthorize`, `/clients/me`, `/clients/me/bookings`) — verified live: own record 200, another client's record 403, ops-only list endpoints 403 for CLIENT role
- [x] Closed a real gap found during this phase's testing: added `clientId`/`employeeId` to the Phase 1 `users` CRUD (`CreateUserRequest`/`UpdateUserRequest`) — without it there was no way to link a portal login to a `Client` record, which would have made the entire client self-service portal unreachable
- [x] Fixed a real JPA bug found during live testing: adding a child to an already-managed parent's cascaded collection (`client.getMaterials().add(...)`, then `save(client)`) triggers `merge()` instead of `persist()`, and merging a transient child returns a *different* instance — the original object's `id` was never populated. Fixed in `ClientService` (materials, documents) and `AgentService` (deals) by flushing the already-managed graph instead of re-saving it.
- [ ] File upload wiring for client documents — the generic `/files/upload` endpoint (Phase 7, pulled forward) works standalone; client-document creation accepts a `fileUrl` but the two haven't been chained together in an end-to-end test yet
- [x] Automated tests (Testcontainers) — `BookingLifecycleIT` (Phase 8) codifies the booking state
      machine walk and the anonymous inquiry endpoint; client materials/documents CRUD, agent
      commission accrual/payout, and row-level scoping remain manual-live-verified only, not yet
      automated

### Phase 4 — Finance
- [x] `payments` table + API — smoke-tested live (invoice numbering, client-scoped self-service history)
- [x] `expenses` table + API — owner read-only vs operations read/write verified live
- [x] `recurring_bills`, `bill_payments` tables + API — bill payment → bill status flips to `PAID`, verified live
- [x] `payroll_records` table + API — `netSalary` computed server-side (never trusted from client input, per section 8); household "My Salary" self-service via `employeeId` on the JWT principal, verified live
- [x] Client-status sync on rent payment (`paid`/`pending`/`overdue`) — verified live: recording a `RENT`/`PAID` payment flips the client's `paymentStatus` to `PAID`
- [x] Row-level scoping: client sees only own payments (`/payments/me`), blocked from the ops ledger (403) — verified live
- [ ] `NumberGeneratorService` as a proper shared service — invoice/payroll numbering currently duplicate the same simple count-and-retry approach used for booking numbers (Phase 3) inline per-service rather than a shared component; correct for a single writer, not yet extracted or made safe under concurrent writers (see section 8)
- [ ] Scheduled job: bill due-date rollover / overdue sweep — not implemented yet (`recurring_bills.status` only changes via explicit payment/mark-paid calls, never automatically on `next_due_date` passing)
- [ ] Automated tests (Testcontainers) — manual live smoke test done (payment recording + client-status side effect, expense CRUD + owner read-only, bill payment lifecycle, payroll generation + net-salary math, household/owner/client permission boundaries); no dedicated automated suite yet (only indirectly exercised via the `UTILITY` payment assertion in Phase 8's `WaterMeterBillingIT` and the finance-endpoint rows in `RoleAccessMatrixIT`)

### Phase 5 — Facilities & Maintenance
- [x] `technicians`, `technician_certifications`, `tech_documents` tables + API — `totalJobs`/`totalPaid` computed at read time from work orders (no drifting counters), verified live
- [x] `tech_work_orders`, `tech_work_order_photos` tables + API + cost roll-up — `totalCost` is a derived (non-persisted) getter = labor + material, verified live
- [x] `preventive_tasks`, `preventive_task_photos` tables + API
- [x] `damage_reports`, `damage_report_photos` tables + API — client-scoped read access verified live
- [x] `water_meters`, `water_meter_readings_history` tables + API + billing calc — consumption/amount math verified exact live (10m³×$1.75=$17.50, then a new billing cycle correctly snapshots the prior cycle into history); `recordPayment` correctly creates a linked `UTILITY` payment in the finance ledger (cross-domain, facilities → finance, one-directional)
- [x] `maintenance_issues`, `maintenance_issue_photos` tables + API (client-facing report flow) — full lifecycle verified live: client reports → ops assigns technician → ops resolves
- [x] Household self-service scoping (own assigned preventive tasks only) — this one needed a real pre-authorization fix: an `@PostAuthorize` check (or none) would let the write happen *before* being blocked. Added `PreventiveTaskAccessGuard`, a `@PreAuthorize`-backed bean that checks `assignedStaffId` against the caller's JWT `employeeId` before the mutation runs. Verified live both ways — own task: 200 and mutated; another's task: 403 and confirmed **not** mutated.
- [x] Automated tests (Testcontainers) — `WaterMeterBillingIT` (Phase 8) codifies the water meter
      billing math and its cross-domain `UTILITY` payment; technician/work-order cost rollup,
      maintenance issue lifecycle, damage report scoping, and the preventive-task pre-authorization
      fix remain manual-live-verified only, not yet automated

### Phase 6 — HR
- [x] `employees`, `employee_documents` tables + API
- [x] `employee_daily_tasks` table + API — verified live: household completes own task, ops rates it, shows up in `/employees/me/history`
- [x] `employee_damages`, `employee_damage_photos` tables + API — modeled with plain `propertyName`/`roomNumber` label strings (not FKs), matching the frontend's `EmployeeDamage` type exactly (unlike `EmployeeDailyTask`, which does carry a real optional `propertyId`)
- [x] `employee_leaves` table + API + status-sync — verified live in all three states: `ACTIVE` → (pending request, still `ACTIVE`) → `ON_LEAVE` (approved) → `ACTIVE` (completed, matching `DataContext.tsx`'s exact sync rule)
- [x] Household self-service endpoints (`/employees/me`, `/employees/me/daily-tasks`, `/employees/me/history`, plus scoped `/employees/{id}/**` access) — verified live both ways: own data 200, another employee's data 403 (list, profile, and leave-creation all confirmed blocked)
- [x] Retrofitted real FK constraints (`NOT VALID`, safe against pre-existing rows) from `payroll_records.employee_id` and `preventive_tasks.assigned_staff_id` onto the new `employees` table, closing the loose-coupling gap those two already-shipped phases left open — verified live: migrated cleanly against the dev database's existing orphaned test references
- [ ] Scheduled job to auto-revert `on_leave` → `active` once `end_date` passes — not implemented (status only changes via explicit leave-status mutations, same deferral as the Phase 4 recurring-bill sweep)
- [x] Automated tests (Testcontainers) — `LeaveStatusSyncIT` (Phase 8) codifies the leave-status
      sync in all three states; daily task lifecycle, damage logging, self-service permission
      boundaries, and the FK backfill migration remain manual-live-verified only, not yet automated

### Phase 7 — Platform (Cross-cutting UX)
- [x] `activity_logs` table + `AuditService` write path — relocated to `common.audit` rather than `platform` specifically to avoid a circular package dependency (every domain calls into it; `platform.NotificationService` depends back on `iam.User` for its broadcast fan-out, so `platform` can't be something `iam` also depends on). Wired into ~25 mutation points across all 6 domains (at least the highest-value create/status-change action per major entity — not literally every mutator, see the frontend-parity list this was built from). Verified live: a real mutation (logging an expense) produced a correctly-attributed log entry (actor name, role, module, details) queryable via `GET /activity-logs`.
- [x] `notifications`, `notification_target_roles`, `notification_recipients` tables + API — verified live: broadcast to CLIENT+HOUSEHOLD roles reached the targeted client (with working per-user mark-read) and was correctly invisible to an untargeted OPERATIONS user
- [x] Dashboard aggregate endpoints (`/dashboard/*`) — all 5 roles implemented and verified live, including owner NOI computed exactly ($317.50 revenue − $195.00 expenses = $122.50)
- [x] Report endpoints — `/reports/revenue-expense`, `/reports/occupancy`, `/reports/property-performance` implemented and verified live
- [x] Global search endpoint — fans out across properties/clients/bookings/employees/technicians, verified live
- [x] Generic file upload endpoint + storage backend wiring — done in Phase 1 (pulled forward)
- [ ] `/reports/export` (CSV/PDF) and a dedicated water-consumption report series — deliberately deferred (file-generation is a separate substantial feature; see section 9)
- [x] Automated tests (Testcontainers) — `RoleAccessMatrixIT` (Phase 8) codifies the full
      permission-boundary sweep across all 5 dashboards and every domain's list endpoints; audit
      trail attribution, notification targeting/read-state, and report correctness remain
      manual-live-verified only, not yet automated

### Phase 8 — Hardening & Handover
- [x] Automated test suite (JUnit 5 + Testcontainers + MockMvc) replacing/codifying the manual
      live-verification discipline used in every prior phase — 148 tests, all passing:
      - `AuthFlowIT` (4 tests) — login success/failure, `/auth/me` valid/missing/invalid token,
        refresh-token flow (incl. an access token rejected as a refresh token), change-password
        (wrong current password, success, old password then fails, new password then works)
      - `RoleAccessMatrixIT` (138 dynamic tests) — full Section 4.1 permission matrix: 27 endpoints
        × 5 roles + 3 publicly-browsable endpoints, asserting every disallowed role gets 403 and
        every allowed role does not
      - `BookingLifecycleIT` (2 tests) — the full booking state machine walk (assign-room → room
        RESERVED, check-in → room OCCUPIED + client's room set, complete → room AVAILABLE +
        client FORMER) and the anonymous booking-inquiry endpoint
      - `WaterMeterBillingIT` (1 test) — exact billing math (10m³×$1.75=$17.50), the linked
        cross-domain `UTILITY` payment, and a second billing cycle correctly snapshotting the
        first into history
      - `LeaveStatusSyncIT` (1 test) — employee status through the full leave lifecycle
        (ACTIVE → still-ACTIVE-while-pending → ON_LEAVE-on-approval → ACTIVE-on-completion)
      - `RateLimitingFilterTest` (2 tests) — a plain unit test (no Spring context) against the
        rate-limiting filter itself, since it's disabled in every IT above (see below)
- [x] Two real bugs found and fixed while building this suite (not just from writing tests):
      1. **Testcontainers/Spring context-cache interaction bug**: `AbstractIntegrationTest`
         originally used `@Testcontainers`/`@Container` to manage the Postgres container's
         lifecycle. Because every IT subclass inherits the exact same `@DynamicPropertySource`
         method, Spring's test-context cache treated their `ApplicationContext`s as identical and
         reused the *first* class's (by-then-stale) datasource connection properties, while the
         `@Testcontainers` JUnit extension independently stopped/restarted a fresh container for
         each class — later test classes ended up pointed at an already-stopped container
         (`Connection refused`). Fixed by switching to the standard Testcontainers "singleton
         container" pattern: start the container once in a static initializer for the whole test
         JVM, never stop it explicitly (Ryuk reaps it on JVM exit).
      2. **Anonymous request to `/auth/me` 500'd instead of returning 401/403**: `/api/v1/auth/**`
         was entirely `permitAll()`, including `/me` and `/change-password`, which both use
         `@AuthenticationPrincipal UserPrincipal principal`. An anonymous caller's principal is an
         `AnonymousAuthenticationToken` (type `String`), which Spring resolves to `null` for a
         mismatched `@AuthenticationPrincipal` type — the controller then NPE'd dereferencing a
         null `principal`. Fixed by narrowing `permitAll()` to only the genuinely-anonymous auth
         endpoints (`login`, `refresh`, `logout`, `forgot-password`, `reset-password`), letting
         `/me` and `/change-password` fall through to `.anyRequest().authenticated()` so Spring
         Security rejects the request before it ever reaches the controller.
- [x] Added `maven-failsafe-plugin` (bound to `integration-test`/`verify`) so `mvn verify` auto-discovers
      every `*IT.java` class by Maven's standard naming convention — previously `mvn test` (surefire)
      silently skipped all of them, since surefire's default include pattern excludes `*IT.java`.
- [x] Full permission-matrix regression test (Section 4.1) — `RoleAccessMatrixIT`, 138 assertions, see above
- [x] Rate limiting on public endpoints (`/auth/login`, `/bookings` inquiry) — `RateLimitingFilter`
      (fixed-window, per-IP, in-memory), configurable via `panther.security.rate-limit.*`
      (default: 10 logins/min, 20 booking inquiries/min per IP). Deliberately disabled in the
      integration-test profile (`AbstractIntegrationTest`'s `@DynamicPropertySource`) since MockMvc
      requests all share one client address and would otherwise trip the limiter across the many
      logins performed by the shared-context IT suite; `RateLimitingFilterTest` is the only place
      the actual limiting behavior is exercised. Single-process/in-memory by design, matching the
      single-instance deployment target — would need a shared store (e.g. Redis) to survive
      horizontal scaling, noted in `PRODUCTION_CHECKLIST.md`.
- [ ] Load-test key list endpoints (payments, activity logs) with realistic volume — deliberately
      deferred; needs a real tool (k6/Gatling/JMeter) against a staging environment, not
      meaningfully approximated by curl loops. See `PRODUCTION_CHECKLIST.md`.
- [x] OpenAPI spec finalized + published for frontend team — exported live from a running instance
      to `backend/openapi.json` (103 unique `/api/v1/**` paths); import directly into
      Postman/Insomnia (both support native OpenAPI import) rather than hand-authoring and
      maintaining a separate collection alongside it.
- [ ] Replace frontend `DataContext` mock state with real API client (separate frontend-side task, not in this backend plan, but flag as the final integration step)
- [x] Production deployment checklist: env secrets, DB backups, HTTPS, log retention, monitoring/alerts — `PRODUCTION_CHECKLIST.md`
- [x] Docs: README updated for Phase 8; ERD exported as a Mermaid diagram (`docs/ERD.md`); OpenAPI
      spec (`openapi.json`) stands in for a hand-authored Postman/Insomnia collection (see above)

---

## 11. What This Plan Deliberately Does Not Decide Yet

- Exact enum-vs-lookup-table choice for small fixed vocabularies (e.g. `ExpenseCategory`) — plan defaults to Java `enum` + `VARCHAR` column (simplest, matches frontend's closed string unions) rather than a separate lookup table, since none of these lists are user-editable in the current frontend. Flag if you want them admin-editable later (would need a lookup table + FK instead).
- Real payment gateway / SMS / email vendor selection (Section 9, item 5 & 8).
- Whether `owner` role gets any write access anywhere (current frontend is 100% read-only for `owner`; plan mirrors that).

---

*This document is the plan only — no backend code has been written yet. Once you confirm Section 9's open decisions, Phase 0 can begin.*
