/**
 * Platform domain: notifications, dashboards/reports, global search, file uploads (Phase 7,
 * implemented). The activity log's entity/service (AuditService) live in `common.audit` instead
 * — every domain needs to write to it, and platform.NotificationService depends back on iam.User,
 * so keeping AuditService in platform would create a circular package dependency. This package
 * still owns the read-only ActivityLogController.
 */
package com.panther.pms.platform;
