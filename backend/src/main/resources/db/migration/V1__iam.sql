-- IAM domain: users, system settings, per-user notification preferences.
-- See BACKEND_PLAN.md section 5.1 for the field-level spec this was generated from.

CREATE TABLE users (
    id                    BIGSERIAL PRIMARY KEY,
    name                  VARCHAR(255) NOT NULL,
    email                 VARCHAR(255) NOT NULL UNIQUE,
    phone                 VARCHAR(50),
    password_hash         VARCHAR(255) NOT NULL,
    role                  VARCHAR(20) NOT NULL,
    avatar_url            TEXT,
    title                 VARCHAR(120),
    client_id             BIGINT,
    employee_id           BIGINT,
    status                VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    last_login_at         TIMESTAMPTZ,
    must_change_password  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_role ON users (role);
CREATE INDEX idx_users_status ON users (status);

CREATE TABLE system_settings (
    id                              BIGSERIAL PRIMARY KEY,
    company_name                    VARCHAR(255) NOT NULL,
    currency_code                   VARCHAR(10) NOT NULL,
    water_rate_per_m3               NUMERIC(8, 2) NOT NULL,
    default_agent_commission_pct    NUMERIC(5, 2) NOT NULL,
    vat_tax_rate_pct                NUMERIC(5, 2) NOT NULL,
    updated_by                      BIGINT REFERENCES users (id),
    created_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE notification_preferences (
    id                    BIGSERIAL PRIMARY KEY,
    user_id               BIGINT NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
    email_notifications   BOOLEAN NOT NULL DEFAULT TRUE,
    sms_notifications     BOOLEAN NOT NULL DEFAULT TRUE,
    theme_preference      VARCHAR(10) NOT NULL DEFAULT 'system',
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
