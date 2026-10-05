package com.panther.pms.security;

import com.panther.pms.common.exception.UnauthorizedException;
import com.panther.pms.config.JwtProperties;
import com.panther.pms.iam.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

@Service
@RequiredArgsConstructor
public class JwtService {

    private static final String CLAIM_TYPE = "type";
    private static final String CLAIM_ROLE = "role";
    private static final String CLAIM_NAME = "name";
    private static final String CLAIM_CLIENT_ID = "clientId";
    private static final String CLAIM_EMPLOYEE_ID = "employeeId";

    private static final String TYPE_ACCESS = "access";
    private static final String TYPE_REFRESH = "refresh";
    private static final String TYPE_PASSWORD_RESET = "password_reset";

    private final JwtProperties jwtProperties;

    private SecretKey signingKey() {
        return Keys.hmacShaKeyFor(jwtProperties.secret().getBytes(StandardCharsets.UTF_8));
    }

    public String generateAccessToken(User user) {
        Instant expiry = Instant.now().plus(jwtProperties.accessTokenTtlMinutes(), ChronoUnit.MINUTES);
        return Jwts.builder()
                .subject(String.valueOf(user.getId()))
                .claim(CLAIM_TYPE, TYPE_ACCESS)
                .claim(CLAIM_ROLE, user.getRole().name())
                .claim(CLAIM_NAME, user.getName())
                .claim(CLAIM_CLIENT_ID, user.getClientId())
                .claim(CLAIM_EMPLOYEE_ID, user.getEmployeeId())
                .issuedAt(Date.from(Instant.now()))
                .expiration(Date.from(expiry))
                .signWith(signingKey())
                .compact();
    }

    public String generateRefreshToken(User user) {
        Instant expiry = Instant.now().plus(jwtProperties.refreshTokenTtlDays(), ChronoUnit.DAYS);
        return Jwts.builder()
                .subject(String.valueOf(user.getId()))
                .claim(CLAIM_TYPE, TYPE_REFRESH)
                .issuedAt(Date.from(Instant.now()))
                .expiration(Date.from(expiry))
                .signWith(signingKey())
                .compact();
    }

    public String generatePasswordResetToken(User user) {
        Instant expiry = Instant.now().plus(30, ChronoUnit.MINUTES);
        return Jwts.builder()
                .subject(String.valueOf(user.getId()))
                .claim(CLAIM_TYPE, TYPE_PASSWORD_RESET)
                .issuedAt(Date.from(Instant.now()))
                .expiration(Date.from(expiry))
                .signWith(signingKey())
                .compact();
    }

    public Claims parseClaims(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(signingKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (JwtException | IllegalArgumentException e) {
            throw new UnauthorizedException("Invalid or expired token.");
        }
    }

    public Long requireUserId(Claims claims) {
        return Long.valueOf(claims.getSubject());
    }

    public void requireType(Claims claims, String expectedType) {
        if (!expectedType.equals(claims.get(CLAIM_TYPE, String.class))) {
            throw new UnauthorizedException("Unexpected token type.");
        }
    }

    public boolean isAccessToken(Claims claims) {
        return TYPE_ACCESS.equals(claims.get(CLAIM_TYPE, String.class));
    }

    public String accessTokenType() {
        return TYPE_ACCESS;
    }

    public String refreshTokenType() {
        return TYPE_REFRESH;
    }

    public String passwordResetTokenType() {
        return TYPE_PASSWORD_RESET;
    }
}
