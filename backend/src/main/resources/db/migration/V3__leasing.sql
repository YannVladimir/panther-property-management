-- Leasing / CRM domain: clients, bookings, agents & commissions.
-- See BACKEND_PLAN.md section 5.3 for the field-level spec this was generated from.

CREATE TABLE clients (
    id                               BIGSERIAL PRIMARY KEY,
    user_id                          BIGINT,
    name                             VARCHAR(255) NOT NULL,
    email                            VARCHAR(255) NOT NULL UNIQUE,
    phone                            VARCHAR(50) NOT NULL,
    avatar_url                       TEXT,
    identification_number            VARCHAR(100) UNIQUE,
    nationality                      VARCHAR(100),
    occupation                       VARCHAR(200),
    employer                         VARCHAR(200),
    emergency_contact_name           VARCHAR(255),
    emergency_contact_phone          VARCHAR(50),
    emergency_contact_relationship   VARCHAR(100),
    current_room_id                  BIGINT REFERENCES rooms (id),
    current_property_id              BIGINT REFERENCES properties (id),
    rental_type                      VARCHAR(30),
    move_in_date                     DATE,
    lease_expiry_date                DATE,
    monthly_rent                     NUMERIC(10, 2),
    deposit_paid                     NUMERIC(10, 2) NOT NULL DEFAULT 0,
    payment_status                   VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    status                           VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    deactivation_reason              TEXT,
    deactivated_date                 DATE,
    notes                            TEXT,
    created_at                       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_clients_status ON clients (status);
CREATE INDEX idx_clients_current_room ON clients (current_room_id);

CREATE TABLE client_materials (
    id                   BIGSERIAL PRIMARY KEY,
    client_id            BIGINT NOT NULL REFERENCES clients (id) ON DELETE CASCADE,
    rental_type_item_id  BIGINT REFERENCES rental_type_included_materials (id),
    name                 VARCHAR(255) NOT NULL,
    quantity             INT NOT NULL DEFAULT 1,
    condition            VARCHAR(20) NOT NULL,
    assigned_date        DATE NOT NULL,
    serial_number        VARCHAR(100),
    category             VARCHAR(150),
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_client_materials_client ON client_materials (client_id);

CREATE TABLE client_documents (
    id            BIGSERIAL PRIMARY KEY,
    client_id     BIGINT NOT NULL REFERENCES clients (id) ON DELETE CASCADE,
    name          VARCHAR(255) NOT NULL,
    type          VARCHAR(30) NOT NULL,
    file_url      TEXT NOT NULL,
    upload_date   DATE NOT NULL,
    size_label    VARCHAR(20),
    status        VARCHAR(20) NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_client_documents_client ON client_documents (client_id);

CREATE TABLE agents (
    id                    BIGSERIAL PRIMARY KEY,
    user_id               BIGINT,
    name                  VARCHAR(255) NOT NULL,
    agency                VARCHAR(255),
    phone                 VARCHAR(50) NOT NULL,
    email                 VARCHAR(255) NOT NULL UNIQUE,
    avatar_url            TEXT,
    status                VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    commission_rate_pct   NUMERIC(5, 2) NOT NULL,
    payment_method        VARCHAR(20),
    payout_account        VARCHAR(255),
    notes                 TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE agent_deals (
    id                     BIGSERIAL PRIMARY KEY,
    agent_id               BIGINT NOT NULL REFERENCES agents (id) ON DELETE CASCADE,
    client_name            VARCHAR(255) NOT NULL,
    client_email           VARCHAR(255),
    client_phone           VARCHAR(50),
    property_id            BIGINT NOT NULL REFERENCES properties (id),
    room_id                BIGINT REFERENCES rooms (id),
    rental_type            VARCHAR(100),
    monthly_rent           NUMERIC(10, 2) NOT NULL,
    commission_percentage  NUMERIC(5, 2) NOT NULL,
    commission_amount      NUMERIC(12, 2) NOT NULL,
    deal_date              DATE NOT NULL DEFAULT CURRENT_DATE,
    status                 VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    payout_date            DATE,
    payout_reference       VARCHAR(100),
    notes                  TEXT,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_agent_deals_agent ON agent_deals (agent_id);

CREATE TABLE bookings (
    id                BIGSERIAL PRIMARY KEY,
    booking_number    VARCHAR(30) NOT NULL UNIQUE,
    client_id         BIGINT REFERENCES clients (id),
    client_name       VARCHAR(255) NOT NULL,
    client_email      VARCHAR(255),
    client_phone      VARCHAR(50),
    property_id       BIGINT NOT NULL REFERENCES properties (id),
    room_id           BIGINT REFERENCES rooms (id),
    rental_type_id    BIGINT NOT NULL REFERENCES rental_types (id),
    requested_date    TIMESTAMPTZ NOT NULL,
    move_in_date      DATE NOT NULL,
    move_out_date     DATE,
    monthly_rent      NUMERIC(10, 2) NOT NULL,
    deposit           NUMERIC(10, 2) NOT NULL DEFAULT 0,
    status            VARCHAR(20) NOT NULL DEFAULT 'REQUESTED',
    notes             TEXT,
    source            VARCHAR(30),
    agent_id          BIGINT REFERENCES agents (id),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_bookings_status ON bookings (status);
CREATE INDEX idx_bookings_client ON bookings (client_id);
CREATE INDEX idx_bookings_property ON bookings (property_id);
CREATE INDEX idx_bookings_agent ON bookings (agent_id);

CREATE TABLE booking_timeline_events (
    id               BIGSERIAL PRIMARY KEY,
    booking_id       BIGINT NOT NULL REFERENCES bookings (id) ON DELETE CASCADE,
    status           VARCHAR(20) NOT NULL,
    occurred_at      TIMESTAMPTZ NOT NULL,
    note             TEXT,
    updated_by_name  VARCHAR(255) NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_booking_timeline_booking ON booking_timeline_events (booking_id);
