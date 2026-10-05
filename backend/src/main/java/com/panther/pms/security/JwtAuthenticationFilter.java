package com.panther.pms.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.panther.pms.common.ApiError;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;
    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                     @NonNull HttpServletResponse response,
                                     @NonNull FilterChain filterChain) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");
        if (StringUtils.hasText(authHeader) && authHeader.startsWith(BEARER_PREFIX)) {
            String token = authHeader.substring(BEARER_PREFIX.length());
            try {
                Claims claims = jwtService.parseClaims(token);
                if (jwtService.isAccessToken(claims) && SecurityContextHolder.getContext().getAuthentication() == null) {
                    Long userId = jwtService.requireUserId(claims);
                    UserDetails principal = userDetailsService.loadUserById(userId);

                    var authToken = new UsernamePasswordAuthenticationToken(
                            principal, null, principal.getAuthorities());
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            } catch (RuntimeException ex) {
                // A Bearer token WAS supplied but couldn't be trusted (expired — the common case,
                // given the short 15-minute access-token TTL — or malformed/tampered). Previously
                // this silently cleared the context and let the request continue as anonymous,
                // which meant every @PreAuthorize check downstream failed as 403 Forbidden instead
                // of 401 Unauthorized. The frontend's silent-refresh-then-retry logic only ever
                // triggers on 401, so it never fired — every mutation attempted after 15 minutes
                // of being logged in failed with an unrecoverable, unexplained 403. Responding 401
                // directly here (short-circuiting the filter chain) lets that existing retry logic
                // do its job, exactly as it does for a token that fails the same way at any other
                // layer (see GlobalExceptionHandler.handleUnauthorized).
                log.debug("Rejecting invalid/expired bearer token: {}", ex.getMessage());
                SecurityContextHolder.clearContext();
                writeUnauthorized(response, request.getRequestURI());
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private void writeUnauthorized(HttpServletResponse response, String path) throws IOException {
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        ApiError body = ApiError.of(HttpStatus.UNAUTHORIZED.value(), HttpStatus.UNAUTHORIZED.getReasonPhrase(),
                "Invalid or expired token.", path);
        response.getWriter().write(objectMapper.writeValueAsString(body));
    }
}
