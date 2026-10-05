-- Property domain: properties, buildings, rooms, rental types.
-- See BACKEND_PLAN.md section 5.2 for the field-level spec this was generated from.
-- Frontend string-array fields (amenities, images, rules, utilities, included materials)
-- are normalized into child tables here rather than kept as JSON blobs.

CREATE TABLE properties (
    id                          BIGSERIAL PRIMARY KEY,
    name                        VARCHAR(255) NOT NULL,
    code                        VARCHAR(20) NOT NULL UNIQUE,
    location                    VARCHAR(255) NOT NULL,
    neighborhood                VARCHAR(150),
    city                        VARCHAR(150),
    address                     TEXT,
    description                 TEXT,
    rating                      NUMERIC(3, 2) NOT NULL DEFAULT 5.0,
    review_count                INT NOT NULL DEFAULT 0,
    featured                    BOOLEAN NOT NULL DEFAULT FALSE,
    year_built                  INT,
    monthly_revenue_estimate    NUMERIC(12, 2) DEFAULT 0,
    status                      VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_properties_status ON properties (status);

CREATE TABLE property_images (
    id            BIGSERIAL PRIMARY KEY,
    property_id   BIGINT NOT NULL REFERENCES properties (id) ON DELETE CASCADE,
    sort_order    INT NOT NULL,
    url           TEXT NOT NULL
);
CREATE INDEX idx_property_images_property ON property_images (property_id);

CREATE TABLE property_amenities (
    id            BIGSERIAL PRIMARY KEY,
    property_id   BIGINT NOT NULL REFERENCES properties (id) ON DELETE CASCADE,
    sort_order    INT NOT NULL,
    amenity       VARCHAR(255) NOT NULL
);
CREATE INDEX idx_property_amenities_property ON property_amenities (property_id);

CREATE TABLE buildings (
    id             BIGSERIAL PRIMARY KEY,
    property_id    BIGINT NOT NULL REFERENCES properties (id) ON DELETE CASCADE,
    name           VARCHAR(150) NOT NULL,
    floors_count   INT NOT NULL DEFAULT 1,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_buildings_property ON buildings (property_id);

CREATE TABLE rental_types (
    id                 BIGSERIAL PRIMARY KEY,
    name               VARCHAR(30) NOT NULL UNIQUE,
    description        TEXT,
    price_multiplier   NUMERIC(5, 3) NOT NULL DEFAULT 1.0,
    status             VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE rental_type_included_materials (
    id               BIGSERIAL PRIMARY KEY,
    rental_type_id   BIGINT NOT NULL REFERENCES rental_types (id) ON DELETE CASCADE,
    name             VARCHAR(255) NOT NULL,
    quantity         INT NOT NULL DEFAULT 1,
    condition        VARCHAR(50) NOT NULL,
    category         VARCHAR(150),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_rtim_rental_type ON rental_type_included_materials (rental_type_id);

CREATE TABLE rental_type_applicable_properties (
    rental_type_id   BIGINT NOT NULL REFERENCES rental_types (id) ON DELETE CASCADE,
    property_id      BIGINT NOT NULL REFERENCES properties (id) ON DELETE CASCADE,
    PRIMARY KEY (rental_type_id, property_id)
);

CREATE TABLE rooms (
    id                   BIGSERIAL PRIMARY KEY,
    property_id          BIGINT NOT NULL REFERENCES properties (id) ON DELETE CASCADE,
    building_id          BIGINT REFERENCES buildings (id) ON DELETE SET NULL,
    room_number          VARCHAR(20) NOT NULL,
    floor                INT NOT NULL DEFAULT 1,
    size_sq_m            NUMERIC(8, 2),
    bedrooms             INT NOT NULL DEFAULT 1,
    bathrooms            INT NOT NULL DEFAULT 1,
    furnishing_type      VARCHAR(30) NOT NULL,
    monthly_rent         NUMERIC(10, 2) NOT NULL,
    deposit              NUMERIC(10, 2) NOT NULL DEFAULT 0,
    status               VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    -- No FK to clients yet — leasing domain lands in Phase 3 (mirrors users.client_id from Phase 1).
    current_client_id    BIGINT,
    virtual_tour_url     TEXT,
    description          TEXT,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_rooms_property ON rooms (property_id);
CREATE INDEX idx_rooms_building ON rooms (building_id);
CREATE INDEX idx_rooms_status ON rooms (status);

CREATE TABLE room_images (
    id          BIGSERIAL PRIMARY KEY,
    room_id     BIGINT NOT NULL REFERENCES rooms (id) ON DELETE CASCADE,
    sort_order  INT NOT NULL,
    url         TEXT NOT NULL
);
CREATE INDEX idx_room_images_room ON room_images (room_id);

CREATE TABLE room_amenities (
    id          BIGSERIAL PRIMARY KEY,
    room_id     BIGINT NOT NULL REFERENCES rooms (id) ON DELETE CASCADE,
    sort_order  INT NOT NULL,
    amenity     VARCHAR(255) NOT NULL
);
CREATE INDEX idx_room_amenities_room ON room_amenities (room_id);

CREATE TABLE room_utilities_included (
    id          BIGSERIAL PRIMARY KEY,
    room_id     BIGINT NOT NULL REFERENCES rooms (id) ON DELETE CASCADE,
    sort_order  INT NOT NULL,
    utility     VARCHAR(255) NOT NULL
);
CREATE INDEX idx_room_utilities_room ON room_utilities_included (room_id);

CREATE TABLE room_rules (
    id          BIGSERIAL PRIMARY KEY,
    room_id     BIGINT NOT NULL REFERENCES rooms (id) ON DELETE CASCADE,
    sort_order  INT NOT NULL,
    rule        TEXT NOT NULL
);
CREATE INDEX idx_room_rules_room ON room_rules (room_id);
