> **HISTORICAL DOCUMENT — DOES NOT REFLECT THE LIVE BACKEND.** This was written *before* the
> Spring Boot backend existed, as the proposed contract for whoever built it. The real backend
> has since been built in `backend/` and its actual contract differs in several ways documented
> here as if they were final — for example this file's schema below uses `VARCHAR(50)` primary
> keys and lowercase enum values (`'operations'`, `'active'`), while the real schema
> (`backend/src/main/resources/db/migration/*.sql`) uses `BIGSERIAL` integer ids and
> UPPERCASE enum values (`'OPERATIONS'`, `'ACTIVE'`). **For the real, current API contract use:**
> `backend/README.md`, `backend/openapi.json` (import into Postman/Insomnia, or run the backend
> and open `/swagger-ui.html`), and `backend/docs/ERD.md`. This file is kept only as a historical
> record of the original integration plan — see `frontend/README.md` for the current, accurate
> frontend documentation.

# 🐆 PANTHER PMS — Frontend Documentation & Backend Integration Guide (original pre-build spec)

> **Version:** 1.0.0  
> **Target Audience:** Backend Engineering & Database Teams  
> **Location:** `frontend/docs/INTEGRATION_SPEC.md` (originally `frontend/README.md`)  
> **Primary Technology Stack:** React 19, TypeScript, Vite, Tailwind-compatible Vanilla CSS (Design Tokens)

---

## 1. System Overview

**Panther PMS** is a real estate and property management platform designed for multi-unit apartment complexes and estates (primary market: East Africa / Rwanda). It provides:
1. **Public Marketing & Booking Engine** (Catalog of properties & suites, booking requests, unit virtual tours).
2. **Tenant / Resident Portal** (Rent payments via Mobile Money / Card, move-in handover inventory checklist, maintenance ticketing).
3. **Operations Manager Center** (CRM booking pipeline, tenant lifecycle, water sub-metering, recurring utility bills, technician dispatch, staff daily task assignments, HR dossiers, and expense tracking).
4. **Property Owner Executive BI** (Portfolio ROI, revenue vs. expense aggregates, occupancy rates).
5. **Household & Janitorial Interface** (Mobile-first categorical preventive maintenance checklist, work history, salary payslips).
6. **System Administrator** (RBAC, property & room CRUD, furnishing tier configurations, system settings).

---

## 2. User Roles & Access Control

| Role | Access Route Prefix | Primary Purpose |
|---|---|---|
| `public` | `/` | Browse estates, suites, submit booking inquiry, auth login. |
| `client` | `/client/*` | Resident dashboard, view room lease, pay rent, view materials, submit tickets. |
| `operations` | `/operations/*` | Day-to-day property management, bookings, water meters, HR, bills, expenses. |
| `owner` | `/owner/*` | High-level portfolio analytics, financials, and occupancy. |
| `household` | `/household/*` | Mobile-friendly checklist for cleaners/caretakers, daily tasks, salary slips. |
| `admin` | `/admin/*` | Full CRUD for properties, rooms, users, rental tiers, global configs. |

---

## 3. Database Schema & Data Dictionary

All backend models, relationships, and required fields needed to persist the frontend data:

### 3.1 `users` Table
```sql
CREATE TABLE users (
  id              VARCHAR(50) PRIMARY KEY,
  name            VARCHAR(255) NOT NULL,
  email           VARCHAR(255) UNIQUE NOT NULL,
  phone           VARCHAR(50),
  role            ENUM('public', 'client', 'operations', 'owner', 'household', 'admin') NOT NULL,
  avatar          TEXT,
  title           VARCHAR(100),
  client_id       VARCHAR(50) REFERENCES clients(id),
  employee_id     VARCHAR(50) REFERENCES employees(id),
  password_hash   VARCHAR(255) NOT NULL,
  status          ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  last_login      DATETIME,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 3.2 `properties` Table (Estates)
```sql
CREATE TABLE properties (
  id                       VARCHAR(50) PRIMARY KEY,
  name                     VARCHAR(255) NOT NULL,
  code                     VARCHAR(20) UNIQUE NOT NULL, -- e.g. "PKG-01"
  location                 VARCHAR(255) NOT NULL,
  neighborhood             VARCHAR(100),
  city                     VARCHAR(100),
  address                  TEXT,
  total_rooms              INT DEFAULT 0,
  occupied_rooms           INT DEFAULT 0,
  available_rooms          INT DEFAULT 0,
  reserved_rooms           INT DEFAULT 0,
  maintenance_rooms        INT DEFAULT 0,
  amenities                JSON, -- e.g. ["High-Speed Fiber", "24/7 Security", "Swimming Pool"]
  images                   JSON, -- array of photo URLs
  description              TEXT,
  rating                   DECIMAL(3,2) DEFAULT 5.0,
  review_count             INT DEFAULT 0,
  featured                 BOOLEAN DEFAULT FALSE,
  year_built               INT,
  monthly_revenue_estimate DECIMAL(12,2) DEFAULT 0,
  status                   ENUM('active', 'maintenance', 'full') DEFAULT 'active',
  created_at               DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at               DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 3.3 `buildings` & `rooms` Table (Suites / Units)
```sql
CREATE TABLE buildings (
  id            VARCHAR(50) PRIMARY KEY,
  property_id   VARCHAR(50) NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  property_name VARCHAR(255),
  name          VARCHAR(100) NOT NULL, -- e.g. "Wing A", "Block 2"
  floors_count  INT DEFAULT 1,
  total_rooms   INT DEFAULT 0
);

CREATE TABLE rooms (
  id                  VARCHAR(50) PRIMARY KEY,
  property_id         VARCHAR(50) NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  property_name       VARCHAR(255),
  building_id         VARCHAR(50) REFERENCES buildings(id),
  building_name       VARCHAR(100),
  room_number         VARCHAR(20) NOT NULL, -- e.g. "101", "Penthouse B"
  floor               INT DEFAULT 1,
  size_sqm            DECIMAL(8,2),
  bedrooms            INT DEFAULT 1,
  bathrooms           INT DEFAULT 1,
  furnishing_type     ENUM('Fully Furnished', 'Self Furnished', 'Semi-Furnished', 'Executive Luxury') NOT NULL,
  monthly_rent        DECIMAL(10,2) NOT NULL,
  deposit             DECIMAL(10,2) DEFAULT 0,
  status              ENUM('available', 'reserved', 'occupied', 'maintenance') DEFAULT 'available',
  amenities           JSON,
  utilities_included  JSON,
  rules               JSON,
  images              JSON,
  current_client_id   VARCHAR(50) REFERENCES clients(id),
  current_client_name VARCHAR(255),
  virtual_tour_url    TEXT,
  description         TEXT,
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 3.4 `rental_types` Table (Furnishing Tiers)
```sql
CREATE TABLE rental_types (
  id               VARCHAR(50) PRIMARY KEY,
  name             VARCHAR(100) NOT NULL,
  description      TEXT,
  price_multiplier DECIMAL(5,3) DEFAULT 1.0,
  status           ENUM('active', 'inactive') DEFAULT 'active',
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rental_type_materials (
  id             VARCHAR(50) PRIMARY KEY,
  rental_type_id VARCHAR(50) NOT NULL REFERENCES rental_types(id) ON DELETE CASCADE,
  name           VARCHAR(255) NOT NULL,
  quantity       INT DEFAULT 1,
  condition      VARCHAR(50) DEFAULT 'Excellent',
  category       VARCHAR(100)
);
```

### 3.5 `bookings` Table
```sql
CREATE TABLE bookings (
  id               VARCHAR(50) PRIMARY KEY,
  booking_number   VARCHAR(30) UNIQUE NOT NULL, -- e.g. "BK-2026-00142"
  client_id        VARCHAR(50) NOT NULL REFERENCES clients(id),
  client_name      VARCHAR(255) NOT NULL,
  client_email     VARCHAR(255),
  client_phone     VARCHAR(50),
  property_id      VARCHAR(50) NOT NULL REFERENCES properties(id),
  property_name    VARCHAR(255),
  room_id          VARCHAR(50) REFERENCES rooms(id),
  room_number      VARCHAR(20),
  rental_type_id   VARCHAR(50) REFERENCES rental_types(id),
  rental_type_name VARCHAR(100),
  requested_date   DATETIME NOT NULL,
  move_in_date     DATE NOT NULL,
  move_out_date    DATE,
  monthly_rent     DECIMAL(10,2) NOT NULL,
  deposit          DECIMAL(10,2) DEFAULT 0,
  status           ENUM('requested', 'under_review', 'approved', 'room_assigned', 'confirmed', 'checked_in', 'cancelled', 'rejected', 'completed') DEFAULT 'requested',
  notes            TEXT,
  source           ENUM('client_portal', 'operations_manager', 'walk_in', 'phone_inquiry', 'agent_referral'),
  agent_id         VARCHAR(50) REFERENCES agents(id),
  agent_name       VARCHAR(255),
  timeline         JSON, -- [{ status, timestamp, note, updatedBy }]
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 3.6 `clients` Table (Tenants)
```sql
CREATE TABLE clients (
  id                    VARCHAR(50) PRIMARY KEY,
  name                  VARCHAR(255) NOT NULL,
  email                 VARCHAR(255) UNIQUE NOT NULL,
  phone                 VARCHAR(50) NOT NULL,
  avatar                TEXT,
  identification_number VARCHAR(100) UNIQUE,
  nationality           VARCHAR(100),
  occupation            VARCHAR(200),
  employer              VARCHAR(200),
  emergency_contact     JSON, -- { name, phone, relationship }
  current_room_id       VARCHAR(50) REFERENCES rooms(id),
  current_room_number   VARCHAR(20),
  current_property_id   VARCHAR(50) REFERENCES properties(id),
  current_property_name VARCHAR(255),
  rental_type           VARCHAR(100),
  move_in_date          DATE,
  lease_expiry_date     DATE,
  monthly_rent          DECIMAL(10,2),
  deposit_paid          DECIMAL(10,2) DEFAULT 0,
  payment_status        ENUM('paid', 'pending', 'overdue') DEFAULT 'pending',
  status                ENUM('active', 'former', 'inactive', 'suspended') DEFAULT 'active',
  deactivation_reason   TEXT,
  deactivated_date      DATE,
  notes                 TEXT,
  created_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE client_materials (
  id            VARCHAR(50) PRIMARY KEY,
  client_id     VARCHAR(50) NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  item_id       VARCHAR(50),
  name          VARCHAR(255) NOT NULL,
  quantity      INT DEFAULT 1,
  condition     ENUM('Excellent', 'Good', 'Fair', 'Needs Repair') DEFAULT 'Excellent',
  assigned_date DATE,
  serial_number VARCHAR(100),
  category      VARCHAR(100)
);

CREATE TABLE client_documents (
  id          VARCHAR(50) PRIMARY KEY,
  client_id   VARCHAR(50) NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  type        ENUM('Tenancy Contract', 'National ID', 'Passport', 'Proof of Income', 'Work Permit', 'Move-In Inventory', 'Deposit Guarantee', 'Other') NOT NULL,
  file_url    TEXT NOT NULL,
  upload_date DATE,
  size        VARCHAR(20),
  status      ENUM('Verified', 'Pending Review', 'Expired') DEFAULT 'Verified'
);
```

### 3.7 `payments` Table (Inflows)
```sql
CREATE TABLE payments (
  id             VARCHAR(50) PRIMARY KEY,
  invoice_number VARCHAR(30) UNIQUE NOT NULL, -- e.g. "INV-2026-00741"
  client_id      VARCHAR(50) NOT NULL REFERENCES clients(id),
  client_name    VARCHAR(255),
  client_avatar  TEXT,
  property_id    VARCHAR(50) REFERENCES properties(id),
  property_name  VARCHAR(255),
  room_id        VARCHAR(50) REFERENCES rooms(id),
  room_number    VARCHAR(20),
  amount         DECIMAL(10,2) NOT NULL,
  date           DATE NOT NULL,
  due_date       DATE,
  type           ENUM('rent', 'deposit', 'utility', 'penalty', 'maintenance', 'other') NOT NULL,
  method         ENUM('Mobile Money', 'Bank Transfer', 'Credit Card', 'Cash') NOT NULL,
  reference      VARCHAR(100), -- MTN MoMo code, Bank Tx ID
  status         ENUM('paid', 'pending', 'overdue', 'cancelled') DEFAULT 'paid',
  receipt_url    TEXT,
  notes          TEXT,
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 3.8 `expenses` & `recurring_bills` Table (Outflows)
```sql
CREATE TABLE expenses (
  id               VARCHAR(50) PRIMARY KEY,
  property_id      VARCHAR(50) REFERENCES properties(id),
  property_name    VARCHAR(255),
  category         ENUM('Maintenance', 'Cleaning', 'Security', 'Utilities', 'Repairs', 'Supplies', 'Staff', 'Landscaping', 'Other') NOT NULL,
  description      TEXT NOT NULL,
  amount           DECIMAL(10,2) NOT NULL,
  date             DATE NOT NULL,
  vendor           VARCHAR(255),
  payment_method   ENUM('Mobile Money', 'Bank Transfer', 'Credit Card', 'Cash') NOT NULL,
  status           ENUM('paid', 'pending') DEFAULT 'paid',
  receipt_attached BOOLEAN DEFAULT FALSE,
  notes            TEXT,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recurring_bills (
  id            VARCHAR(50) PRIMARY KEY,
  property_id   VARCHAR(50) REFERENCES properties(id),
  property_name VARCHAR(255),
  name          VARCHAR(255) NOT NULL,
  category      ENUM('Electricity', 'Water', 'Internet', 'Security', 'Cleaning', 'Maintenance Contract', 'Garbage Collection') NOT NULL,
  vendor        VARCHAR(255),
  amount        DECIMAL(10,2) NOT NULL,
  frequency     ENUM('Monthly', 'Quarterly', 'Bi-Weekly', 'Annual') DEFAULT 'Monthly',
  next_due_date DATE NOT NULL,
  status        ENUM('paid', 'upcoming', 'overdue') DEFAULT 'upcoming',
  auto_renew    BOOLEAN DEFAULT TRUE,
  reminder_days INT DEFAULT 5,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bill_payments (
  id         VARCHAR(50) PRIMARY KEY,
  bill_id    VARCHAR(50) NOT NULL REFERENCES recurring_bills(id) ON DELETE CASCADE,
  paid_date  DATE NOT NULL,
  amount     DECIMAL(10,2) NOT NULL,
  method     ENUM('Mobile Money', 'Bank Transfer', 'Cash', 'Cheque') NOT NULL,
  reference  VARCHAR(100),
  notes      TEXT,
  proof_url  TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 3.9 `water_meters` Table (Sub-Metering & Utilities)
```sql
CREATE TABLE water_meters (
  id               VARCHAR(50) PRIMARY KEY,
  property_id      VARCHAR(50) REFERENCES properties(id),
  property_name    VARCHAR(255),
  room_id          VARCHAR(50) REFERENCES rooms(id),
  room_number      VARCHAR(20),
  client_id        VARCHAR(50) NOT NULL REFERENCES clients(id),
  client_name      VARCHAR(255),
  meter_number     VARCHAR(100) UNIQUE NOT NULL,
  previous_reading DECIMAL(10,3) DEFAULT 0,
  current_reading  DECIMAL(10,3) DEFAULT 0,
  consumption_m3   DECIMAL(10,3) DEFAULT 0,
  reading_date     DATE,
  rate_per_m3      DECIMAL(6,2) NOT NULL, -- e.g. $1.50 per m³
  total_amount     DECIMAL(10,2) DEFAULT 0,
  payment_status   ENUM('paid', 'pending', 'overdue') DEFAULT 'pending',
  history          JSON, -- [{ month, reading, consumption, amount }]
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 3.10 `employees`, `payroll_records`, `employee_daily_tasks`, `employee_leaves`, `employee_damages`
```sql
CREATE TABLE employees (
  id                VARCHAR(50) PRIMARY KEY,
  name              VARCHAR(255) NOT NULL,
  avatar            TEXT,
  position          VARCHAR(255) NOT NULL,
  department        ENUM('Operations', 'Maintenance', 'Housekeeping', 'Security', 'Finance', 'Management') NOT NULL,
  contact           VARCHAR(50) NOT NULL,
  email             VARCHAR(255) UNIQUE,
  employment_status ENUM('Full-Time', 'Part-Time', 'Contract') DEFAULT 'Full-Time',
  status            ENUM('active', 'on_leave', 'suspended', 'terminated') DEFAULT 'active',
  status_reason     TEXT,
  start_date        DATE NOT NULL,
  basic_salary      DECIMAL(10,2) NOT NULL,
  national_id       VARCHAR(100) UNIQUE,
  address           TEXT,
  emergency_contact JSON, -- { name, phone, relationship }
  created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE employee_daily_tasks (
  id              VARCHAR(50) PRIMARY KEY,
  employee_id     VARCHAR(50) NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  title           VARCHAR(255) NOT NULL,
  description     TEXT,
  assigned_date   DATE NOT NULL,
  due_date        DATE NOT NULL,
  priority        ENUM('High', 'Medium', 'Low') DEFAULT 'Medium',
  property_id     VARCHAR(50) REFERENCES properties(id),
  property_name   VARCHAR(255),
  room_number     VARCHAR(20),
  status          ENUM('Pending', 'In Progress', 'Completed', 'Rejected') DEFAULT 'Pending',
  completed_date  DATE,
  manager_comment TEXT,
  rating          INT, -- 1 to 5 stars
  rated_by        VARCHAR(255)
);

CREATE TABLE employee_leaves (
  id             VARCHAR(50) PRIMARY KEY,
  employee_id    VARCHAR(50) NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type     ENUM('Annual Leave', 'Sick Leave', 'Maternity / Paternity', 'Compassionate Leave', 'Unpaid Leave') NOT NULL,
  start_date     DATE NOT NULL,
  end_date       DATE NOT NULL,
  days_count     INT NOT NULL,
  reason         TEXT,
  status         ENUM('Approved', 'Pending', 'Completed', 'Cancelled') DEFAULT 'Approved',
  approved_by    VARCHAR(255),
  requested_date DATE NOT NULL
);

CREATE TABLE employee_damages (
  id                   VARCHAR(50) PRIMARY KEY,
  employee_id          VARCHAR(50) NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  incident_date        DATE NOT NULL,
  item                 VARCHAR(255) NOT NULL,
  property_name        VARCHAR(255),
  room_number          VARCHAR(20),
  description          TEXT,
  estimated_cost       DECIMAL(10,2) DEFAULT 0,
  deducted_from_salary BOOLEAN DEFAULT FALSE,
  deducted_amount      DECIMAL(10,2) DEFAULT 0,
  status               ENUM('Investigating', 'Deducted', 'Forgiven', 'Settled') DEFAULT 'Investigating',
  photos               JSON
);

CREATE TABLE payroll_records (
  id             VARCHAR(50) PRIMARY KEY,
  payroll_number VARCHAR(30) UNIQUE NOT NULL, -- e.g. "PAY-2026-00112"
  employee_id    VARCHAR(50) NOT NULL REFERENCES employees(id),
  employee_name  VARCHAR(255),
  position       VARCHAR(255),
  department     VARCHAR(100),
  period         VARCHAR(30) NOT NULL, -- e.g. "August 2026"
  basic_salary   DECIMAL(10,2) NOT NULL,
  allowances     DECIMAL(10,2) DEFAULT 0,
  bonuses        DECIMAL(10,2) DEFAULT 0,
  deductions     DECIMAL(10,2) DEFAULT 0,
  tax_amount     DECIMAL(10,2) DEFAULT 0,
  net_salary     DECIMAL(10,2) NOT NULL,
  payment_date   DATE,
  payment_status ENUM('Paid', 'Processing', 'Pending') DEFAULT 'Paid',
  payment_method ENUM('Mobile Money', 'Bank Transfer', 'Credit Card', 'Cash') NOT NULL,
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 3.11 `technicians` & `technician_work_orders` Table
```sql
CREATE TABLE technicians (
  id               VARCHAR(50) PRIMARY KEY,
  name             VARCHAR(255) NOT NULL,
  company          VARCHAR(255),
  contact          VARCHAR(50) NOT NULL,
  email            VARCHAR(255),
  avatar           TEXT,
  specialization   ENUM('Plumber', 'Electrician', 'Carpenter', 'HVAC', 'Painter', 'IT & Security', 'General Maintenance') NOT NULL,
  rating           DECIMAL(3,2) DEFAULT 5.0,
  availability     ENUM('Available', 'On Job', 'Unavailable') DEFAULT 'Available',
  total_jobs       INT DEFAULT 0,
  total_paid       DECIMAL(12,2) DEFAULT 0,
  hourly_rate      DECIMAL(8,2),
  notes            TEXT,
  address          TEXT,
  national_id      VARCHAR(100),
  emergency_contact JSON,
  preferred_payment_method ENUM('Mobile Money', 'Bank Transfer', 'Cash'),
  payout_account   VARCHAR(255),
  certifications   JSON,
  years_experience INT DEFAULT 0
);

CREATE TABLE technician_work_orders (
  id              VARCHAR(50) PRIMARY KEY,
  technician_id   VARCHAR(50) NOT NULL REFERENCES technicians(id) ON DELETE CASCADE,
  job_number      VARCHAR(30) UNIQUE NOT NULL,
  property_id     VARCHAR(50) REFERENCES properties(id),
  property_name   VARCHAR(255),
  room_id         VARCHAR(50) REFERENCES rooms(id),
  room_number     VARCHAR(20),
  title           VARCHAR(255) NOT NULL,
  description     TEXT,
  category        VARCHAR(100),
  priority        ENUM('Low', 'Medium', 'High', 'Emergency') DEFAULT 'Medium',
  dispatched_date DATE NOT NULL,
  start_date      DATE,
  completed_date  DATE,
  estimated_hours DECIMAL(6,2),
  actual_hours    DECIMAL(6,2),
  labor_cost      DECIMAL(10,2) DEFAULT 0,
  material_cost   DECIMAL(10,2) DEFAULT 0,
  total_cost      DECIMAL(10,2) DEFAULT 0,
  payment_status  ENUM('Unpaid', 'Partially Paid', 'Paid') DEFAULT 'Unpaid',
  paid_amount     DECIMAL(10,2) DEFAULT 0,
  status          ENUM('Dispatched', 'In Progress', 'Completed', 'Cancelled', 'On Hold') DEFAULT 'Dispatched',
  rating          INT,
  rating_comment  TEXT,
  photos          JSON,
  notes           TEXT
);
```

### 3.12 `preventive_tasks`, `damage_reports`, `maintenance_issues`, `agents`
```sql
CREATE TABLE preventive_tasks (
  id                  VARCHAR(50) PRIMARY KEY,
  property_id         VARCHAR(50) REFERENCES properties(id),
  property_name       VARCHAR(255),
  category            VARCHAR(100) NOT NULL,
  task_name           VARCHAR(255) NOT NULL,
  frequency           ENUM('Weekly', 'Bi-Weekly', 'Monthly', 'Quarterly', 'Custom') DEFAULT 'Weekly',
  schedule_week       INT DEFAULT 1,
  assigned_staff_id   VARCHAR(50) REFERENCES employees(id),
  assigned_staff_name VARCHAR(255),
  status              ENUM('pass', 'failed', 'needs_attention', 'not_applicable', 'pending') DEFAULT 'pending',
  remarks             TEXT,
  evidence_photos     JSON,
  due_date            DATE,
  last_completed_date DATE,
  resolved_date       DATE
);

CREATE TABLE damage_reports (
  id                VARCHAR(50) PRIMARY KEY,
  property_id       VARCHAR(50) REFERENCES properties(id),
  property_name     VARCHAR(255),
  room_id           VARCHAR(50) REFERENCES rooms(id),
  room_number       VARCHAR(20),
  client_id         VARCHAR(50) REFERENCES clients(id),
  client_name       VARCHAR(255),
  item              VARCHAR(255) NOT NULL,
  damage_type       VARCHAR(100),
  description       TEXT,
  reported_date     DATE NOT NULL,
  photos            JSON,
  estimated_cost    DECIMAL(10,2) DEFAULT 0,
  amount_charged    DECIMAL(10,2) DEFAULT 0,
  responsible_party ENUM('Tenant', 'Property Owner', 'Wear & Tear', 'Contractor') DEFAULT 'Tenant',
  status            ENUM('Pending Review', 'In Repair', 'Resolved', 'Disputed') DEFAULT 'Pending Review',
  resolution_notes  TEXT
);

CREATE TABLE maintenance_issues (
  id                       VARCHAR(50) PRIMARY KEY,
  ticket_number            VARCHAR(30) UNIQUE NOT NULL,
  client_id                VARCHAR(50) NOT NULL REFERENCES clients(id),
  client_name              VARCHAR(255),
  client_avatar            TEXT,
  property_id              VARCHAR(50) REFERENCES properties(id),
  property_name            VARCHAR(255),
  room_id                  VARCHAR(50) REFERENCES rooms(id),
  room_number              VARCHAR(20),
  category                 VARCHAR(100) NOT NULL,
  title                    VARCHAR(255) NOT NULL,
  description              TEXT,
  priority                 ENUM('Low', 'Medium', 'High', 'Emergency') DEFAULT 'Medium',
  photos                   JSON,
  status                   ENUM('Submitted', 'Reviewed', 'Assigned', 'In Progress', 'Resolved', 'Closed') DEFAULT 'Submitted',
  reported_date            DATETIME NOT NULL,
  assigned_technician_id   VARCHAR(50) REFERENCES technicians(id),
  assigned_technician_name VARCHAR(255),
  technician_specialty     VARCHAR(100),
  resolution_date          DATE,
  resolution_notes         TEXT
);

CREATE TABLE agents (
  id                      VARCHAR(50) PRIMARY KEY,
  name                    VARCHAR(255) NOT NULL,
  agency                  VARCHAR(255),
  phone                   VARCHAR(50) NOT NULL,
  email                   VARCHAR(255) UNIQUE NOT NULL,
  avatar                  TEXT,
  status                  ENUM('Active', 'Inactive') DEFAULT 'Active',
  clients_referred        INT DEFAULT 0,
  bookings_count          INT DEFAULT 0,
  successful_rentals      INT DEFAULT 0,
  commission_rate_percent DECIMAL(5,2) DEFAULT 10.0,
  total_commission_earned DECIMAL(12,2) DEFAULT 0,
  commission_paid         DECIMAL(12,2) DEFAULT 0,
  outstanding_commission  DECIMAL(12,2) DEFAULT 0,
  payment_method          ENUM('Mobile Money', 'Bank Transfer', 'Cash'),
  payout_account          VARCHAR(255),
  notes                   TEXT,
  deals                   JSON -- [{ id, clientName, propertyName, monthlyRent, commissionAmount, status, date }]
);
```

---

## 4. Detailed Guide to Every Frontend Page & API Expectations

### 4.1 Public Website

| URL Route | Component | Required Data / Backend Expectations |
|---|---|---|
| `/` | `HomePage.tsx` | Featured estates list, portfolio headline stats (occupancy rate, unit count), dynamic testimonials. |
| `/properties` | `PropertiesPage.tsx` | Full catalog of properties with search query, price filtering, and furnishing tier options. |
| `/property/:id` | `PropertyDetailPage.tsx` | Specific property info, unit availability breakdown, photo gallery, location GPS, available suites list. |
| `/room/:id` | `RoomDetailPage.tsx` | Unit layout, size in m², pricing multiplier, amenities, virtual tour link, and direct booking modal. |
| `/login` | `LoginPage.tsx` | Role-switching auth simulator. In production: `POST /api/auth/login` returns JWT + user object. |

---

### 4.2 Client Portal (`/client/*`)

| URL Route | Component | Purpose & Data Contract |
|---|---|---|
| `/client` | `ClientDashboard.tsx` | Resident landing page with current lease overview, next rent payment deadline, active maintenance tickets, and unread notifications. |
| `/client/my-booking` | `MyBookingPage.tsx` | Status of rental applications (steps: requested → under_review → approved → room_assigned → confirmed). |
| `/client/my-room` | `MyRoomPage.tsx` | Details of current rented suite, house rules, included utilities, landlord contacts. |
| `/client/payments` | `ClientPaymentsPage.tsx` | Paginated invoice and payment history. Integrates mobile money and card payment receipts. |
| `/client/my-materials` | `MyMaterialsPage.tsx` | Move-in inventory checklist (sofas, fridge, TV, keys). Resident can inspect and mark conditions (*Excellent*, *Good*, *Fair*, *Needs Repair*). |
| `/client/report-issue` | `ReportIssuePage.tsx` | Maintenance ticket submission form with photo upload and urgent priority toggle. |
| `/client/notifications`| `ClientNotificationsPage.tsx`| Notification feed with role-filtering and mark-as-read mutations. |

---

### 4.3 Operations Manager Portal (`/operations/*`)

| URL Route | Component | Purpose & Data Contract |
|---|---|---|
| `/operations` | `OperationsDashboard.tsx` | Operations summary: live occupancy %, monthly revenue tracker, pending bookings requiring action, today's overdue bills, assigned staff tasks. |
| `/operations/bookings` | `BookingsManagementPage.tsx` | Pipeline management. Slide-in side drawer for new bookings. Actions: approve, reject, assign unit, confirm. Paginated datatable. |
| `/operations/clients` | `ClientsManagementPage.tsx` | All tenant directory. Shows active vs former status, quick contact, room assignment, and overdue flags. Paginated datatable. |
| `/operations/clients/:id` | `ClientDetailPage.tsx` | **Resident Dossier**: 7 sub-tabs: 1. Overview & Edit Profile, 2. Documents & Contracts, 3. Handover Materials Checklist (condition updater), 4. Damage Liability & Charges, 5. Payments & Invoices (with Record Payment modal), 6. Maintenance History, 7. Water Meter live metrics. |
| `/operations/properties` | `PropertiesManagementPage.tsx` | Quick visual breakdown of estate units, occupancy stats, and financial yields. |
| `/operations/payments` | `PaymentsManagementPage.tsx` | Central payment ledger with payment filters, exportable rows, invoice generation. Paginated datatable. |
| `/operations/agents` | `AgentsCommissionsPage.tsx` | Real estate broker registry, tracking referral commissions, recording payout transactions. Paginated datatable. |
| `/operations/expenses` | `ExpensesPage.tsx` | Company expenses tracker categorized by repairs, supplies, staff, utilities. Paginated datatable. |
| `/operations/recurring-bills` | `RecurringBillsPage.tsx` | Fixed utility and vendor contracts (EWSA Electricity, Water, Starlink Internet, Security). Calendar due dates & payment logging. Paginated datatable. |
| `/operations/technicians` | `TechniciansPage.tsx` | Outside contractor management (Plumbers, Electricians, HVAC). Work order dispatching and job performance rating. Paginated grid. |
| `/operations/preventive-maintenance` | `PreventiveMaintenancePage.tsx` | Manager view of property preventive routines. Slide-in side drawer for creating new preventive measures. Categorized inspection matrix. |
| `/operations/damages` | `DamagesManagementPage.tsx` | Incident management. Slide-in side drawer for logging new damages with multi-photo uploads, liability assignment, and resolution confirmation modal. Paginated datatable. |
| `/operations/water-meters` | `WaterMetersPage.tsx` | **Water Sub-Metering Hub**: Lists all clients with active tenants at the top. Slide-in side panel to record new meter readings (computes consumption & bill). Slide-in payment recorder. Historical consumption drawer. Paginated datatable. |
| `/operations/hr-payroll` | `HRPayrollPage.tsx` | **HR Central**: Staff directory (leads, cleaners, security), salary metrics, and company-wide payroll disbursement history table. Slide-in side drawer to add new employee. Paginated datatable. |
| `/operations/hr-payroll/:id` | `EmployeeDetailPage.tsx` | **Employee Dossier**: 1. Profile & Salary Editor (slide panel), 2. Daily Task Assignment & Rating (slide panel), 3. Official Payroll Records & Payslip generator (slide panel), 4. Leave Management with automated *on_leave* status switching (slide panel), 5. Equipment Damages & Salary Deductions (slide panel with photos), 6. Compliance HR Document uploads. |
| `/operations/reports` | `ReportsPage.tsx` | Visual charts of revenue streams, occupancy trends, and monthly P&L summaries. |
| `/operations/activity-log` | `ActivityLogPage.tsx` | Immutable audit log of all system actions (user logins, status updates, bill payments). |

---

### 4.4 Household Staff Portal (`/household/*`)

| URL Route | Component | Purpose & Data Contract |
|---|---|---|
| `/household` | `HouseholdDashboard.tsx` | Cleaning & maintenance staff homepage. Shows assigned tasks for today, rating badges, and one-tap status toggles. |
| `/household/checklist` | `HouseholdChecklistPage.tsx` | **Simplified Categorical Inspection**: Non-technical UI. Groups measures into categories (Common Areas, Corridors, Lighting, Roofs, etc.). Staff taps a category, sees remaining items, and marks *Pass / Needs Attention / Fail* with optional photo proof. |
| `/household/history` | `HouseholdTaskHistoryPage.tsx`| Log of all previous checklist rounds and supervisor comments. |
| `/household/salary` | `HouseholdSalaryPage.tsx` | Staff member's personal payslips ledger, breakdown of base salary, transport allowances, deductions, and downloadable payslip modal. Paginated datatable. |

---

### 4.5 Owner Executive BI (`/owner/*`)

| URL Route | Component | Purpose & Data Contract |
|---|---|---|
| `/owner` | `OwnerExecutiveDashboard.tsx` | Executive summary for property owners and investors: total portfolio valuation, net operating income (NOI), portfolio occupancy rate, revenue forecasts. |

---

### 4.6 System Admin Portal (`/admin/*`)

| URL Route | Component | Purpose & Data Contract |
|---|---|---|
| `/admin` | `AdminDashboard.tsx` | System infrastructure health, user counts by role, database disk space, system logs. |
| `/admin/properties` | `AdminPropertiesPage.tsx` | Full CRUD for properties. Configures estate marketing descriptions, GPS coordinates, amenities, and photo galleries. Paginated datatable. |
| `/admin/properties/new` or `/:id` | `AdminPropertyEditPage.tsx` | Comprehensive form to create or edit an estate. |
| `/admin/buildings-rooms` | `AdminBuildingsRoomsPage.tsx` | Full inventory table of all rooms across all properties. Paginated datatable. |
| `/admin/buildings-rooms/new` or `/:id` | `AdminRoomEditPage.tsx` | Suite configuration editor (floor, size in m², furnishing tier, price, rules, virtual tour link). |
| `/admin/rental-types` | `AdminRentalTypesPage.tsx` | Configure furnishing tiers (multiplier, included materials inventory templates). |
| `/admin/users` | `AdminUsersRolesPage.tsx` | User management table (RBAC). Slide-in side drawer for creating/editing users, password reset links, deactivation/suspension confirmation modals. Paginated datatable. |
| `/admin/settings` | `AdminSystemSettingsPage.tsx` | Global constants (currency code, default water tariff per m³, tax rate %, notification SMTP config). |

---

## 5. Key Business Logic & Computational Rules

### 5.1 Water Meter Billing Equation
1. Every client room is assigned a physical meter number.
2. When recording a new reading:
   $$\text{Consumption } (\text{m}^3) = \text{Current Reading} - \text{Previous Reading}$$
   $$\text{Total Bill } (\$) = \text{Consumption } (\text{m}^3) \times \text{Rate per } \text{m}^3 \quad (\text{default: } \$1.50/\text{m}^3)$$
3. The newly computed bill is generated with status `pending`.
4. Marking the bill as paid resets the cycle and appends to `history` array.

### 5.2 Booking Status Lifecycle
$$\text{requested} \longrightarrow \text{under\_review} \longrightarrow \text{approved} \longrightarrow \text{room\_assigned} \longrightarrow \text{confirmed} \longrightarrow \text{checked\_in} \longrightarrow \text{completed}$$
- When a booking reaches `checked_in`, the associated room's status must automatically update to `occupied` and the client's `currentRoomId` is assigned.
- When `completed` (move-out), the room reverts to `available` and client status updates to `former`.

### 5.3 Employee Leave & Status Sync
- When an employee leave record is saved with `status = "Approved"`:
  - If $\text{startDate} \le \text{today} \le \text{endDate}$, employee `status` must automatically update to `on_leave`.
  - Once $\text{today} > \text{endDate}$, employee `status` reverts to `active`.

### 5.4 Broker / Agent Commissions
$$\text{Commission Earned } (\$) = \text{Monthly Rent } (\$) \times \left(\frac{\text{Commission Rate } \%}{100}\right)$$
$$\text{Outstanding Balance } (\$) = \text{Total Earned} - \text{Commission Paid}$$

### 5.5 Universal DataTable Pagination Specification
All paginated endpoints must support standard query parameters:
- `page`: 1-based index (e.g. `?page=1`)
- `limit`: page size (e.g. `?limit=10`, `20`, `50`)
- `search`: string search across primary text fields
- `status`: filter by status enum

Response format:
```json
{
  "data": [ ... ],
  "meta": {
    "totalItems": 142,
    "currentPage": 1,
    "pageSize": 10,
    "totalPages": 15
  }
}
```

---

## 6. Recommended API Routes

```
# Auth
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
POST   /api/auth/change-password

# Properties & Rooms
GET    /api/properties
POST   /api/properties
GET    /api/properties/:id
PATCH  /api/properties/:id
DELETE /api/properties/:id
GET    /api/rooms
POST   /api/rooms
GET    /api/rooms/:id
PATCH  /api/rooms/:id
DELETE /api/rooms/:id

# Bookings & Clients
GET    /api/bookings
POST   /api/bookings
PATCH  /api/bookings/:id/status
PATCH  /api/bookings/:id/assign-room
GET    /api/clients
POST   /api/clients
GET    /api/clients/:id
PATCH  /api/clients/:id
PATCH  /api/clients/:id/status
POST   /api/clients/:id/documents
PATCH  /api/clients/:id/materials/:materialId

# Finance & Bills
GET    /api/payments
POST   /api/payments
GET    /api/expenses
POST   /api/expenses
GET    /api/recurring-bills
POST   /api/recurring-bills
POST   /api/recurring-bills/:id/payments

# Water Sub-metering
GET    /api/water-meters
POST   /api/water-meters
PATCH  /api/water-meters/:id/reading
PATCH  /api/water-meters/:id/pay

# HR & Payroll
GET    /api/employees
POST   /api/employees
GET    /api/employees/:id
PATCH  /api/employees/:id
PATCH  /api/employees/:id/status
POST   /api/employees/:id/tasks
PATCH  /api/employees/:empId/tasks/:taskId
POST   /api/employees/:id/leaves
POST   /api/employees/:id/damages
POST   /api/employees/:id/documents
GET    /api/payroll
POST   /api/payroll

# Operations Support
GET    /api/technicians
POST   /api/technicians
POST   /api/technicians/:id/work-orders
GET    /api/preventive-tasks
POST   /api/preventive-tasks
PATCH  /api/preventive-tasks/:id
GET    /api/damages
POST   /api/damages
PATCH  /api/damages/:id
PATCH  /api/damages/:id/status
GET    /api/agents
POST   /api/agents
POST   /api/agents/:id/deals
POST   /api/agents/:id/payout
GET    /api/maintenance
POST   /api/maintenance
PATCH  /api/maintenance/:id

# System & Analytics
GET    /api/reports/summary
GET    /api/reports/revenue
GET    /api/reports/occupancy
GET    /api/reports/expenses
GET    /api/activity-logs
GET    /api/notifications
PATCH  /api/notifications/:id/read
```

---
*Generated for Panther PMS Backend Integration.*
