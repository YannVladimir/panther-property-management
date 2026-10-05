package com.panther.pms.common.ratelimit;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.panther.pms.config.RateLimitProperties;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Fixed-window per-IP rate limiter for the small set of endpoints reachable without
 * authentication (see BACKEND_PLAN.md section 10, Phase 8) — login (credential-stuffing /
 * brute force) and the anonymous booking inquiry (spam). A single-process in-memory counter is
 * sufficient given the single-instance/local-disk deployment target chosen for this app; if the
 * backend is ever horizontally scaled this would need to move to a shared store (e.g. Redis).
 *
 * Disabled outright (panther.security.rate-limit.enabled=false) in the integration test profile,
 * since MockMvc requests all share one client address and would otherwise trip the limiter across
 * the many logins performed by the wider test suite sharing the cached Spring context.
 */
public class RateLimitingFilter extends OncePerRequestFilter {

    private record Rule(String method, String path, int limit, long windowMillis) {
    }

    private record Window(AtomicLong windowStart, AtomicInteger count) {
    }

    private final List<Rule> rules;
    private final boolean enabled;
    private final Map<String, Window> windows = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public RateLimitingFilter(RateLimitProperties properties) {
        this.enabled = properties.enabled();
        this.rules = List.of(
                new Rule("POST", "/api/v1/auth/login", properties.loginLimit(), properties.loginWindowSeconds() * 1000L),
                new Rule("POST", "/api/v1/bookings", properties.bookingLimit(), properties.bookingWindowSeconds() * 1000L)
        );
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        Rule matched = enabled ? rules.stream()
                .filter(r -> r.method().equalsIgnoreCase(request.getMethod()) && r.path().equals(request.getRequestURI()))
                .findFirst()
                .orElse(null) : null;

        if (matched == null || !isRateLimited(matched, request.getRemoteAddr())) {
            filterChain.doFilter(request, response);
            return;
        }

        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getWriter(),
                Map.of("error", "Too many requests. Please try again in a minute."));
    }

    private boolean isRateLimited(Rule rule, String clientIp) {
        String key = rule.method() + " " + rule.path() + " " + clientIp;
        long now = System.currentTimeMillis();
        Window window = windows.computeIfAbsent(key, k -> new Window(new AtomicLong(now), new AtomicInteger(0)));

        synchronized (window) {
            if (now - window.windowStart().get() >= rule.windowMillis()) {
                window.windowStart().set(now);
                window.count().set(0);
            }
            return window.count().incrementAndGet() > rule.limit();
        }
    }
}
