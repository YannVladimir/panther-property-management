# Panther PMS — Entity Relationship Diagram

Generated from the authoritative schema spec in `BACKEND_PLAN.md` section 5, after all 8 Flyway
migrations (`V1__iam.sql` – `V8__platform.sql`). Scope: the 23 primary entity tables and the child
tables whose relationships matter for understanding the model. Pure single-column "list" child
tables that only hold a repeated value against a parent id (`property_images`, `room_amenities`,
`technician_certifications`, every `*_photos` table, etc. — ~15 tables total) are omitted here for
legibility; each is a simple `(id, <parent>_id FK, value)` table, documented in full in section 5.

```mermaid
erDiagram
    USERS {
        bigint id PK
        varchar email UK
        varchar role
        bigint client_id FK
        bigint employee_id FK
    }
    SYSTEM_SETTINGS { bigint id PK }
    NOTIFICATION_PREFERENCES { bigint user_id PK_FK }

    PROPERTIES { bigint id PK }
    BUILDINGS { bigint id PK }
    RENTAL_TYPES { bigint id PK }
    ROOMS {
        bigint id PK
        bigint property_id FK
        bigint building_id FK
        bigint current_client_id FK
        varchar status
    }

    CLIENTS {
        bigint id PK
        bigint current_room_id FK
        bigint current_property_id FK
        varchar status
    }
    CLIENT_MATERIALS { bigint id PK }
    CLIENT_DOCUMENTS { bigint id PK }
    BOOKINGS {
        bigint id PK
        bigint client_id FK
        bigint property_id FK
        bigint room_id FK
        bigint rental_type_id FK
        bigint agent_id FK
        varchar status
    }
    BOOKING_TIMELINE_EVENTS { bigint id PK }
    AGENTS { bigint id PK }
    AGENT_DEALS {
        bigint id PK
        bigint agent_id FK
        bigint property_id FK
        bigint room_id FK
    }

    PAYMENTS {
        bigint id PK
        bigint client_id FK
        bigint property_id FK
        bigint room_id FK
        varchar type
        varchar status
    }
    EXPENSES { bigint id PK }
    RECURRING_BILLS { bigint id PK }
    BILL_PAYMENTS { bigint id PK }
    PAYROLL_RECORDS {
        bigint id PK
        bigint employee_id FK
    }

    TECHNICIANS { bigint id PK }
    TECH_WORK_ORDERS {
        bigint id PK
        bigint technician_id FK
        bigint property_id FK
        bigint room_id FK
    }
    PREVENTIVE_TASKS {
        bigint id PK
        bigint property_id FK
        bigint assigned_staff_id FK
    }
    DAMAGE_REPORTS {
        bigint id PK
        bigint property_id FK
        bigint room_id FK
        bigint client_id FK
    }
    WATER_METERS {
        bigint id PK
        bigint property_id FK
        bigint room_id FK
        bigint client_id FK
    }
    WATER_METER_READINGS_HISTORY { bigint id PK }
    MAINTENANCE_ISSUES {
        bigint id PK
        bigint client_id FK
        bigint property_id FK
        bigint room_id FK
        bigint assigned_technician_id FK
    }

    EMPLOYEES { bigint id PK }
    EMPLOYEE_DAILY_TASKS {
        bigint id PK
        bigint employee_id FK
        bigint property_id FK
        bigint room_id FK
    }
    EMPLOYEE_DAMAGES { bigint id PK }
    EMPLOYEE_LEAVES { bigint id PK }
    EMPLOYEE_DOCUMENTS { bigint id PK }

    ACTIVITY_LOGS {
        bigint id PK
        bigint user_id FK
    }
    NOTIFICATIONS { bigint id PK }
    NOTIFICATION_RECIPIENTS {
        bigint id PK
        bigint notification_id FK
        bigint user_id FK
    }

    USERS ||--o| CLIENTS : "client_id"
    USERS ||--o| EMPLOYEES : "employee_id"
    USERS ||--o{ ACTIVITY_LOGS : "acts as"
    USERS ||--o{ NOTIFICATION_RECIPIENTS : "receives"
    USERS ||--o| NOTIFICATION_PREFERENCES : "has"

    PROPERTIES ||--o{ BUILDINGS : "has"
    PROPERTIES ||--o{ ROOMS : "has"
    BUILDINGS ||--o{ ROOMS : "has"
    RENTAL_TYPES ||--o{ ROOMS : "furnishing type"

    CLIENTS ||--o| ROOMS : "current room"
    CLIENTS ||--o{ CLIENT_MATERIALS : "owns"
    CLIENTS ||--o{ CLIENT_DOCUMENTS : "owns"
    CLIENTS ||--o{ BOOKINGS : "makes (nullable — anon inquiry)"
    CLIENTS ||--o{ PAYMENTS : "pays"
    CLIENTS ||--o{ DAMAGE_REPORTS : "linked to"
    CLIENTS ||--o{ WATER_METERS : "billed"
    CLIENTS ||--o{ MAINTENANCE_ISSUES : "reports"

    PROPERTIES ||--o{ BOOKINGS : "for"
    ROOMS ||--o{ BOOKINGS : "assigned (nullable)"
    RENTAL_TYPES ||--o{ BOOKINGS : "of type"
    BOOKINGS ||--o{ BOOKING_TIMELINE_EVENTS : "history"
    AGENTS ||--o{ BOOKINGS : "referred (nullable)"
    AGENTS ||--o{ AGENT_DEALS : "closes"
    PROPERTIES ||--o{ AGENT_DEALS : "for"
    ROOMS ||--o{ AGENT_DEALS : "for (nullable)"

    PROPERTIES ||--o{ PAYMENTS : "for"
    ROOMS ||--o{ PAYMENTS : "for"
    PROPERTIES ||--o{ EXPENSES : "incurs"
    PROPERTIES ||--o{ RECURRING_BILLS : "has"
    RECURRING_BILLS ||--o{ BILL_PAYMENTS : "paid via"
    EMPLOYEES ||--o{ PAYROLL_RECORDS : "paid"

    TECHNICIANS ||--o{ TECH_WORK_ORDERS : "assigned"
    PROPERTIES ||--o{ TECH_WORK_ORDERS : "at"
    ROOMS ||--o{ TECH_WORK_ORDERS : "at (nullable)"
    PROPERTIES ||--o{ PREVENTIVE_TASKS : "scheduled at"
    EMPLOYEES ||--o{ PREVENTIVE_TASKS : "assigned to"
    PROPERTIES ||--o{ DAMAGE_REPORTS : "at"
    ROOMS ||--o{ DAMAGE_REPORTS : "at"
    PROPERTIES ||--o{ WATER_METERS : "at"
    ROOMS ||--o{ WATER_METERS : "at"
    WATER_METERS ||--o{ WATER_METER_READINGS_HISTORY : "billing cycles"
    PROPERTIES ||--o{ MAINTENANCE_ISSUES : "at"
    ROOMS ||--o{ MAINTENANCE_ISSUES : "at"
    TECHNICIANS ||--o{ MAINTENANCE_ISSUES : "assigned (nullable)"

    EMPLOYEES ||--o{ EMPLOYEE_DAILY_TASKS : "assigned"
    PROPERTIES ||--o{ EMPLOYEE_DAILY_TASKS : "at (nullable)"
    EMPLOYEES ||--o{ EMPLOYEE_DAMAGES : "responsible"
    EMPLOYEES ||--o{ EMPLOYEE_LEAVES : "requests"
    EMPLOYEES ||--o{ EMPLOYEE_DOCUMENTS : "has"

    NOTIFICATIONS ||--o{ NOTIFICATION_RECIPIENTS : "targets"
```

## Cross-domain dependency direction

Matches `BACKEND_PLAN.md` section 3's package-dependency discipline — arrows above generally point
"forward" through `iam → property → leasing → finance → facilities → hr → platform`. The one
cross-cutting exception is `common.audit.AuditService`, called from all six domains but owned by
neither (see section 3 for why it isn't in `platform`).
