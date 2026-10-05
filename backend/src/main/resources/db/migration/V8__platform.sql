-- Platform domain: activity log, notifications.
-- See BACKEND_PLAN.md section 5.7 for the field-level spec this was generated from.
-- Note: activity_logs.user_id deliberately has NO foreign key — an audit trail should
-- survive even if the user who performed the action is later deleted.

CREATE TABLE activity_logs (
    id            BIGSERIAL PRIMARY KEY,
    occurred_at   TIMESTAMPTZ NOT NULL,
    user_id       BIGINT,
    user_name     VARCHAR(255) NOT NULL,
    role          VARCHAR(20) NOT NULL,
    action        VARCHAR(255) NOT NULL,
    module        VARCHAR(100) NOT NULL,
    details       TEXT NOT NULL,
    type          VARCHAR(20) NOT NULL
);
CREATE INDEX idx_activity_logs_occurred_at ON activity_logs (occurred_at);
CREATE INDEX idx_activity_logs_module ON activity_logs (module);

CREATE TABLE notifications (
    id           BIGSERIAL PRIMARY KEY,
    title        VARCHAR(255) NOT NULL,
    message      TEXT NOT NULL,
    type         VARCHAR(20) NOT NULL,
    link         TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE notification_target_roles (
    notification_id   BIGINT NOT NULL REFERENCES notifications (id) ON DELETE CASCADE,
    role              VARCHAR(20) NOT NULL,
    PRIMARY KEY (notification_id, role)
);

CREATE TABLE notification_recipients (
    id                BIGSERIAL PRIMARY KEY,
    notification_id   BIGINT NOT NULL REFERENCES notifications (id) ON DELETE CASCADE,
    user_id           BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    read_at           TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notification_recipients_user ON notification_recipients (user_id);
