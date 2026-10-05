-- Facilities & maintenance domain: technicians, work orders, preventive tasks,
-- damage reports, water meters, tenant-reported maintenance issues.
-- See BACKEND_PLAN.md section 5.5 for the field-level spec this was generated from.

CREATE TABLE technicians (
    id                         BIGSERIAL PRIMARY KEY,
    name                       VARCHAR(255) NOT NULL,
    company                    VARCHAR(255),
    contact                    VARCHAR(50) NOT NULL,
    email                      VARCHAR(255),
    avatar_url                 TEXT,
    specialization             VARCHAR(30) NOT NULL,
    rating                     NUMERIC(3, 2) NOT NULL DEFAULT 5.0,
    availability               VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    hourly_rate                NUMERIC(8, 2),
    notes                      TEXT,
    address                    TEXT,
    national_id                VARCHAR(100),
    emergency_contact_name     VARCHAR(255),
    emergency_contact_phone    VARCHAR(50),
    emergency_contact_relationship VARCHAR(100),
    preferred_payment_method   VARCHAR(20),
    payout_account             VARCHAR(255),
    years_experience           INT,
    created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                 TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE technician_certifications (
    id             BIGSERIAL PRIMARY KEY,
    technician_id  BIGINT NOT NULL REFERENCES technicians (id) ON DELETE CASCADE,
    sort_order     INT NOT NULL,
    certification  VARCHAR(255) NOT NULL
);
CREATE INDEX idx_tech_certifications_tech ON technician_certifications (technician_id);

CREATE TABLE tech_documents (
    id               BIGSERIAL PRIMARY KEY,
    technician_id    BIGINT NOT NULL REFERENCES technicians (id) ON DELETE CASCADE,
    name             VARCHAR(255) NOT NULL,
    type             VARCHAR(20) NOT NULL,
    file_url         TEXT NOT NULL,
    upload_date      DATE NOT NULL,
    expiry_date      DATE,
    status           VARCHAR(20) NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tech_documents_tech ON tech_documents (technician_id);

CREATE TABLE tech_work_orders (
    id                BIGSERIAL PRIMARY KEY,
    technician_id     BIGINT NOT NULL REFERENCES technicians (id) ON DELETE CASCADE,
    job_number        VARCHAR(30) NOT NULL UNIQUE,
    property_id       BIGINT NOT NULL REFERENCES properties (id),
    room_id           BIGINT REFERENCES rooms (id),
    title             VARCHAR(255) NOT NULL,
    description       TEXT,
    category          VARCHAR(20) NOT NULL,
    priority          VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    dispatched_date   DATE NOT NULL,
    start_date        DATE,
    completed_date    DATE,
    estimated_hours   NUMERIC(6, 2),
    actual_hours      NUMERIC(6, 2),
    labor_cost        NUMERIC(10, 2) NOT NULL DEFAULT 0,
    material_cost     NUMERIC(10, 2) NOT NULL DEFAULT 0,
    payment_status    VARCHAR(20) NOT NULL DEFAULT 'UNPAID',
    paid_amount       NUMERIC(10, 2) NOT NULL DEFAULT 0,
    status            VARCHAR(20) NOT NULL DEFAULT 'DISPATCHED',
    rating            INT,
    rating_comment    TEXT,
    notes             TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_work_orders_technician ON tech_work_orders (technician_id);
CREATE INDEX idx_work_orders_property ON tech_work_orders (property_id);

CREATE TABLE tech_work_order_photos (
    id             BIGSERIAL PRIMARY KEY,
    work_order_id  BIGINT NOT NULL REFERENCES tech_work_orders (id) ON DELETE CASCADE,
    sort_order     INT NOT NULL,
    url            TEXT NOT NULL
);
CREATE INDEX idx_wo_photos_wo ON tech_work_order_photos (work_order_id);

CREATE TABLE preventive_tasks (
    id                    BIGSERIAL PRIMARY KEY,
    property_id           BIGINT NOT NULL REFERENCES properties (id),
    category              VARCHAR(30) NOT NULL,
    task_name             VARCHAR(255) NOT NULL,
    frequency             VARCHAR(20) NOT NULL,
    schedule_week         INT NOT NULL DEFAULT 1,
    assigned_staff_id     BIGINT,
    assigned_staff_name   VARCHAR(255),
    status                VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    remarks               TEXT,
    due_date              DATE NOT NULL,
    last_completed_date   DATE,
    resolved_date         DATE,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_preventive_tasks_property ON preventive_tasks (property_id);
CREATE INDEX idx_preventive_tasks_staff ON preventive_tasks (assigned_staff_id);

CREATE TABLE preventive_task_photos (
    id          BIGSERIAL PRIMARY KEY,
    task_id     BIGINT NOT NULL REFERENCES preventive_tasks (id) ON DELETE CASCADE,
    sort_order  INT NOT NULL,
    url         TEXT NOT NULL
);
CREATE INDEX idx_preventive_photos_task ON preventive_task_photos (task_id);

CREATE TABLE damage_reports (
    id                 BIGSERIAL PRIMARY KEY,
    property_id        BIGINT NOT NULL REFERENCES properties (id),
    room_id            BIGINT NOT NULL REFERENCES rooms (id),
    client_id          BIGINT REFERENCES clients (id),
    item               VARCHAR(255) NOT NULL,
    damage_type        VARCHAR(150),
    description        TEXT,
    reported_date      DATE NOT NULL,
    estimated_cost     NUMERIC(10, 2) NOT NULL DEFAULT 0,
    amount_charged     NUMERIC(10, 2) NOT NULL DEFAULT 0,
    responsible_party  VARCHAR(20) NOT NULL,
    status             VARCHAR(20) NOT NULL DEFAULT 'PENDING_REVIEW',
    resolution_notes   TEXT,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_damage_reports_property ON damage_reports (property_id);
CREATE INDEX idx_damage_reports_client ON damage_reports (client_id);

CREATE TABLE damage_report_photos (
    id                BIGSERIAL PRIMARY KEY,
    damage_report_id  BIGINT NOT NULL REFERENCES damage_reports (id) ON DELETE CASCADE,
    sort_order        INT NOT NULL,
    url               TEXT NOT NULL
);
CREATE INDEX idx_damage_photos_report ON damage_report_photos (damage_report_id);

CREATE TABLE water_meters (
    id                BIGSERIAL PRIMARY KEY,
    property_id       BIGINT NOT NULL REFERENCES properties (id),
    room_id           BIGINT NOT NULL REFERENCES rooms (id),
    client_id         BIGINT NOT NULL REFERENCES clients (id),
    meter_number      VARCHAR(100) NOT NULL UNIQUE,
    previous_reading  NUMERIC(10, 3) NOT NULL DEFAULT 0,
    current_reading   NUMERIC(10, 3) NOT NULL DEFAULT 0,
    consumption_m3    NUMERIC(10, 3) NOT NULL DEFAULT 0,
    reading_date      DATE,
    rate_per_m3       NUMERIC(6, 2) NOT NULL,
    total_amount      NUMERIC(10, 2) NOT NULL DEFAULT 0,
    payment_status    VARCHAR(20) NOT NULL DEFAULT 'PAID',
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_water_meters_client ON water_meters (client_id);

CREATE TABLE water_meter_readings_history (
    id               BIGSERIAL PRIMARY KEY,
    water_meter_id   BIGINT NOT NULL REFERENCES water_meters (id) ON DELETE CASCADE,
    period_month     VARCHAR(20) NOT NULL,
    reading          NUMERIC(10, 3) NOT NULL,
    consumption      NUMERIC(10, 3) NOT NULL,
    amount           NUMERIC(10, 2) NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_water_history_meter ON water_meter_readings_history (water_meter_id);

CREATE TABLE maintenance_issues (
    id                       BIGSERIAL PRIMARY KEY,
    ticket_number            VARCHAR(30) NOT NULL UNIQUE,
    client_id                BIGINT NOT NULL REFERENCES clients (id),
    property_id              BIGINT NOT NULL REFERENCES properties (id),
    room_id                  BIGINT NOT NULL REFERENCES rooms (id),
    category                 VARCHAR(20) NOT NULL,
    title                    VARCHAR(255) NOT NULL,
    description              TEXT,
    priority                 VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    status                   VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED',
    reported_date            TIMESTAMPTZ NOT NULL,
    assigned_technician_id   BIGINT REFERENCES technicians (id),
    resolution_date          DATE,
    resolution_notes         TEXT,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_issues_client ON maintenance_issues (client_id);
CREATE INDEX idx_issues_status ON maintenance_issues (status);

CREATE TABLE maintenance_issue_photos (
    id          BIGSERIAL PRIMARY KEY,
    issue_id    BIGINT NOT NULL REFERENCES maintenance_issues (id) ON DELETE CASCADE,
    sort_order  INT NOT NULL,
    url         TEXT NOT NULL
);
CREATE INDEX idx_issue_photos_issue ON maintenance_issue_photos (issue_id);
