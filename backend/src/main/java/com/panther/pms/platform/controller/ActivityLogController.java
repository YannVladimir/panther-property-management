package com.panther.pms.platform.controller;

import com.panther.pms.common.PageResponse;
import com.panther.pms.common.audit.ActivityLog;
import com.panther.pms.common.audit.ActivityLogRepository;
import com.panther.pms.common.audit.ActivityLogSpecifications;
import com.panther.pms.common.audit.ActivityType;
import com.panther.pms.platform.dto.ActivityLogResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@RestController
@RequestMapping("/api/v1/activity-logs")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('OPERATIONS', 'ADMIN', 'OWNER')")
public class ActivityLogController {

    private final ActivityLogRepository activityLogRepository;

    @GetMapping
    public PageResponse<ActivityLogResponse> list(@RequestParam(required = false) String module,
                                                   @RequestParam(required = false) ActivityType type,
                                                   @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
                                                   @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
                                                   Pageable pageable) {
        var page = activityLogRepository
                .findAll(ActivityLogSpecifications.filter(module, type, from, to), pageable)
                .map(this::toResponse);
        return PageResponse.of(page);
    }

    private ActivityLogResponse toResponse(ActivityLog a) {
        return new ActivityLogResponse(a.getId(), a.getOccurredAt(), a.getUserId(), a.getUserName(), a.getRole(),
                a.getAction(), a.getModule(), a.getDetails(), a.getType());
    }
}
