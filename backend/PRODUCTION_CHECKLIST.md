# Production Deployment Checklist

Everything here is unchecked by default — this is a checklist for whoever deploys, not a claim
that it's done. Cross-reference `BACKEND_PLAN.md` section 10 for what's been built and verified.

## Secrets & configuration

- [ ] `PANTHER_JWT_SECRET` set to a real random value (32+ bytes), never the `application.yml`
      dev placeholder (`dev-only-secret-key-change-me-please-32bytes-min`). Rotating this
      invalidates every outstanding access/refresh token — plan a rotation window.
- [ ] `PANTHER_ADMIN_EMAIL` / `PANTHER_ADMIN_PASSWORD` overridden from the dev defaults before
      first boot against a production database, or `PANTHER_SEED_ENABLED=false` if the admin
      account will be created another way. The seeded account's `mustChangePassword=true`, so
      confirm the frontend's first-login flow actually enforces a change before relying on this.
- [ ] Database credentials (`SPRING_DATASOURCE_*` / `DB_*`) sourced from a secrets manager or the
      platform's env-var injection, never committed to `docker-compose.yml` or checked into git.
- [ ] `panther.cors.allowed-origins` set to the real frontend origin(s) only — the dev default
      (`localhost:5173`/`localhost:4173`) must not reach production.
- [ ] `spring.profiles.active=prod` (`application-prod.yml`) confirmed active, not `dev`.

## Database

- [ ] Automated backups configured (point-in-time recovery if the managed Postgres offering
      supports it) with a tested restore procedure — an untested backup is not a backup.
- [ ] Flyway migrations reviewed for the target Postgres version; `V7__wire_employee_foreign_keys.sql`
      uses `NOT VALID` constraints deliberately (see `BACKEND_PLAN.md` section 10, Phase 6) — decide
      whether to run `VALIDATE CONSTRAINT` once orphan data is confirmed clean.
- [ ] Connection pool sizing (HikariCP defaults) reviewed against actual concurrent load, not left
      at Spring Boot's defaults untested.
- [ ] `spring.jpa.hibernate.ddl-auto` confirmed `validate` or unset in prod (Flyway owns schema
      changes; Hibernate must never auto-migrate against production data).

## Networking & transport

- [ ] HTTPS terminated in front of the app (load balancer / reverse proxy / platform ingress) —
      the app itself serves plain HTTP; JWTs and passwords must never cross the wire unencrypted.
- [ ] `Secure`/`HttpOnly` cookie flags not applicable here (JWT is returned in the JSON body per
      the confirmed decision, not a cookie) — but confirm the frontend never logs or persists the
      access/refresh token anywhere insecure (e.g. plain localStorage without XSS mitigations).
- [ ] Rate limiting (`panther.security.rate-limit.*`, see `RateLimitingFilter`) tuned for real
      traffic patterns — current defaults (10 logins/min, 20 booking inquiries/min per IP) were
      chosen for a single-instance dev/small-deployment target, not load-tested against production
      traffic. If the backend is ever horizontally scaled, this in-memory per-process limiter must
      move to a shared store (e.g. Redis) — see the class-level comment on `RateLimitingFilter`.

## File storage

- [ ] `PANTHER_UPLOAD_DIR` points at a volume that is actually backed up and persists across
      container restarts/redeploys — local disk storage was the explicitly confirmed choice for
      now (see section 9), but that means the upload directory is a single point of data loss if
      it isn't on durable, backed-up storage.
- [ ] Disk space monitoring/alerting on the upload volume — no size cap is enforced beyond the
      15MB per-file limit already configured (`spring.servlet.multipart.max-file-size`).

## Observability

- [ ] Log retention/shipping configured (the app currently logs to stdout only) — decide on a log
      aggregation target before relying on container logs surviving redeploys.
- [ ] Monitoring/alerting wired to `management.endpoints.web.exposure` (`health`, `info`) — at
      minimum, alert on `/actuator/health` going unhealthy; consider exposing `metrics`/`prometheus`
      if the deployment target scrapes them (not currently enabled — would need the
      `micrometer-registry-prometheus` dependency added).
- [ ] Decide on and configure structured audit-log retention/export for `activity_logs` — it is
      currently an unbounded, ever-growing append-only table with no archival policy.

## Rollback

- [ ] Confirm the deployment platform supports rolling back to the previous container image
      quickly, and that Flyway migrations in this codebase are additive/backward-compatible
      enough that rolling back the app without rolling back the schema won't break (audit new
      migrations for this before every release, not just at launch).

## Explicitly deferred (not blocking, but tracked)

These were deliberately not built as part of this backend effort — see `BACKEND_PLAN.md` sections
9 and 10 for the reasoning behind each:

- **Load testing** — the automated suite (`mvn verify`, see `BACKEND_PLAN.md` section 10 Phase 8)
  verifies correctness, not throughput/latency under realistic concurrent load. That needs a real
  tool (k6, Gatling, JMeter) run against a staging environment sized like production, not something
  meaningfully approximated with curl loops.
- **CSV/PDF report export** (`/reports/export`) and a dedicated water-consumption report series.
- **Scheduled jobs** for recurring-bill due-date rollover and leave `on_leave → active` auto-revert
  — both currently only change status via explicit user-triggered mutations.
- **Horizontal scaling** of the app tier — the rate limiter (above) and the local-disk file storage
  choice both assume a single app instance; either would need rework (shared cache / object storage)
  before running more than one instance behind a load balancer.
