-- Finance domain: payments, expenses, recurring bills, payroll.
-- See BACKEND_PLAN.md section 5.4 for the field-level spec this was generated from.

CREATE TABLE payments (
    id               BIGSERIAL PRIMARY KEY,
    invoice_number   VARCHAR(30) NOT NULL UNIQUE,
    client_id        BIGINT NOT NULL REFERENCES clients (id),
    property_id      BIGINT NOT NULL REFERENCES properties (id),
    room_id          BIGINT NOT NULL REFERENCES rooms (id),
    amount           NUMERIC(10, 2) NOT NULL,
    payment_date     DATE NOT NULL,
    due_date         DATE,
    type             VARCHAR(20) NOT NULL,
    method           VARCHAR(20) NOT NULL,
    reference        VARCHAR(100),
    status           VARCHAR(20) NOT NULL,
    receipt_url      TEXT,
    notes            TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payments_client ON payments (client_id);
CREATE INDEX idx_payments_property ON payments (property_id);
CREATE INDEX idx_payments_status ON payments (status);

CREATE TABLE expenses (
    id                 BIGSERIAL PRIMARY KEY,
    property_id        BIGINT NOT NULL REFERENCES properties (id),
    category           VARCHAR(20) NOT NULL,
    description        TEXT NOT NULL,
    amount             NUMERIC(10, 2) NOT NULL,
    expense_date       DATE NOT NULL,
    vendor             VARCHAR(255),
    payment_method     VARCHAR(20) NOT NULL,
    status             VARCHAR(20) NOT NULL DEFAULT 'PAID',
    receipt_attached   BOOLEAN NOT NULL DEFAULT FALSE,
    notes              TEXT,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_expenses_property ON expenses (property_id);
CREATE INDEX idx_expenses_category ON expenses (category);

CREATE TABLE recurring_bills (
    id               BIGSERIAL PRIMARY KEY,
    property_id      BIGINT NOT NULL REFERENCES properties (id),
    name             VARCHAR(255) NOT NULL,
    category         VARCHAR(30) NOT NULL,
    vendor           VARCHAR(255),
    amount           NUMERIC(10, 2) NOT NULL,
    frequency        VARCHAR(20) NOT NULL,
    next_due_date    DATE NOT NULL,
    status           VARCHAR(20) NOT NULL DEFAULT 'UPCOMING',
    auto_renew       BOOLEAN NOT NULL DEFAULT TRUE,
    reminder_days    INT NOT NULL DEFAULT 5,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_recurring_bills_property ON recurring_bills (property_id);
CREATE INDEX idx_recurring_bills_status ON recurring_bills (status);

CREATE TABLE bill_payments (
    id                  BIGSERIAL PRIMARY KEY,
    recurring_bill_id   BIGINT NOT NULL REFERENCES recurring_bills (id) ON DELETE CASCADE,
    paid_date           DATE NOT NULL,
    amount              NUMERIC(10, 2) NOT NULL,
    method              VARCHAR(20) NOT NULL,
    reference           VARCHAR(100),
    notes               TEXT,
    proof_url           TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_bill_payments_bill ON bill_payments (recurring_bill_id);

CREATE TABLE payroll_records (
    id               BIGSERIAL PRIMARY KEY,
    payroll_number   VARCHAR(30) NOT NULL UNIQUE,
    employee_id      BIGINT NOT NULL,
    employee_name    VARCHAR(255) NOT NULL,
    position         VARCHAR(255),
    department       VARCHAR(100),
    period           VARCHAR(30) NOT NULL,
    basic_salary     NUMERIC(10, 2) NOT NULL,
    allowances       NUMERIC(10, 2) NOT NULL DEFAULT 0,
    bonuses          NUMERIC(10, 2) NOT NULL DEFAULT 0,
    deductions       NUMERIC(10, 2) NOT NULL DEFAULT 0,
    tax_amount       NUMERIC(10, 2) NOT NULL DEFAULT 0,
    net_salary       NUMERIC(10, 2) NOT NULL,
    payment_date     DATE,
    payment_status   VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    payment_method   VARCHAR(20) NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payroll_employee ON payroll_records (employee_id);
