-- HR domain: employees, employee documents/daily-tasks/damages/leaves.
-- See BACKEND_PLAN.md section 5.6 for the field-level spec this was generated from.

CREATE TABLE employees (
    id                              BIGSERIAL PRIMARY KEY,
    name                            VARCHAR(255) NOT NULL,
    avatar_url                      TEXT,
    position                        VARCHAR(255) NOT NULL,
    department                      VARCHAR(20) NOT NULL,
    contact                         VARCHAR(50) NOT NULL,
    email                           VARCHAR(255),
    employment_status               VARCHAR(20) NOT NULL,
    status                          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    status_reason                   TEXT,
    start_date                      DATE NOT NULL,
    basic_salary                    NUMERIC(10, 2) NOT NULL,
    national_id                     VARCHAR(100) UNIQUE,
    emergency_contact_name          VARCHAR(255),
    emergency_contact_phone         VARCHAR(50),
    emergency_contact_relationship  VARCHAR(100),
    address                         TEXT,
    created_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_employees_department ON employees (department);
CREATE INDEX idx_employees_status ON employees (status);

CREATE TABLE employee_documents (
    id             BIGSERIAL PRIMARY KEY,
    employee_id    BIGINT NOT NULL REFERENCES employees (id) ON DELETE CASCADE,
    name           VARCHAR(255) NOT NULL,
    type           VARCHAR(30) NOT NULL,
    file_url       TEXT NOT NULL,
    upload_date    DATE NOT NULL,
    size_label     VARCHAR(20),
    status         VARCHAR(20) NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_employee_documents_employee ON employee_documents (employee_id);

CREATE TABLE employee_daily_tasks (
    id                BIGSERIAL PRIMARY KEY,
    employee_id       BIGINT NOT NULL REFERENCES employees (id) ON DELETE CASCADE,
    title             VARCHAR(255) NOT NULL,
    description       TEXT,
    assigned_date     DATE NOT NULL,
    due_date          DATE NOT NULL,
    priority          VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    property_id       BIGINT REFERENCES properties (id),
    room_number       VARCHAR(20),
    status            VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    completed_date    DATE,
    manager_comment   TEXT,
    rating            INT,
    rated_by_name     VARCHAR(255),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_daily_tasks_employee ON employee_daily_tasks (employee_id);

CREATE TABLE employee_damages (
    id                     BIGSERIAL PRIMARY KEY,
    employee_id            BIGINT NOT NULL REFERENCES employees (id) ON DELETE CASCADE,
    incident_date          DATE NOT NULL,
    item                   VARCHAR(255) NOT NULL,
    property_name          VARCHAR(255),
    room_number            VARCHAR(20),
    description            TEXT,
    estimated_cost         NUMERIC(10, 2) NOT NULL DEFAULT 0,
    deducted_from_salary   BOOLEAN NOT NULL DEFAULT FALSE,
    deducted_amount        NUMERIC(10, 2) NOT NULL DEFAULT 0,
    status                 VARCHAR(20) NOT NULL DEFAULT 'INVESTIGATING',
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_employee_damages_employee ON employee_damages (employee_id);

CREATE TABLE employee_damage_photos (
    id                     BIGSERIAL PRIMARY KEY,
    employee_damage_id     BIGINT NOT NULL REFERENCES employee_damages (id) ON DELETE CASCADE,
    sort_order             INT NOT NULL,
    url                    TEXT NOT NULL
);
CREATE INDEX idx_employee_damage_photos_damage ON employee_damage_photos (employee_damage_id);

CREATE TABLE employee_leaves (
    id                BIGSERIAL PRIMARY KEY,
    employee_id       BIGINT NOT NULL REFERENCES employees (id) ON DELETE CASCADE,
    leave_type        VARCHAR(30) NOT NULL,
    start_date        DATE NOT NULL,
    end_date          DATE NOT NULL,
    days_count        INT NOT NULL,
    reason            TEXT,
    status            VARCHAR(20) NOT NULL,
    approved_by_name  VARCHAR(255),
    requested_date    DATE NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_employee_leaves_employee ON employee_leaves (employee_id);
