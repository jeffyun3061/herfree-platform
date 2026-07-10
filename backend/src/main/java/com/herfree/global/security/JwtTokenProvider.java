package com.herfree.global.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Component;

@Component
public class JwtTokenProvider {

    private static final String PROFILE_COMPLETION_PURPOSE = "oauth_profile";
    private static final long PROFILE_COMPLETION_EXPIRATION_SECONDS = 900L;

    private final JwtProperties jwtProperties;
    private final SecretKey secretKey;

    public JwtTokenProvider(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
        this.secretKey = Keys.hmacShaKeyFor(jwtProperties.secret().getBytes(StandardCharsets.UTF_8));
    }

    // role을 claim에 포함하는 이유:
    // 매 요청마다 DB에서 권한을 조회하지 않아도 필터 단계에서 올바른 권한을 SecurityContext에 설정할 수 있다.
    // 권한이 변경되면 토큰을 재발급받아야 하므로, 권한 변경 후 재로그인을 유도해야 한다.
    public String createAccessToken(String subject, String role) {
        Instant now = Instant.now();
        Instant expiry = now.plusSeconds(jwtProperties.accessExpirationSeconds());

        return Jwts.builder()
                .subject(subject)
                .claim("role", role)
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(secretKey)
                .compact();
    }

    public String createProfileCompletionToken(String userId) {
        Instant now = Instant.now();
        Instant expiry = now.plusSeconds(PROFILE_COMPLETION_EXPIRATION_SECONDS);

        return Jwts.builder()
                .subject(userId)
                .claim("purpose", PROFILE_COMPLETION_PURPOSE)
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(secretKey)
                .compact();
    }

    public Long validateProfileCompletionToken(String token) {
        try {
            Claims claims = parseClaims(token);
            String purpose = claims.get("purpose", String.class);
            if (!PROFILE_COMPLETION_PURPOSE.equals(purpose)) {
                throw new JwtException("Invalid profile completion token");
            }
            return Long.parseLong(claims.getSubject());
        } catch (JwtException | NumberFormatException ex) {
            throw new JwtException("Invalid profile completion token", ex);
        }
    }

    public boolean validateToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException ex) {
            return false;
        }
    }

    public String getSubject(String token) {
        return parseClaims(token).getSubject();
    }

    // JWT의 role claim을 꺼낸다.
    // claim이 없으면 null을 반환하므로 호출부에서 null 처리가 필요하다.
    public String getRole(String token) {
        return parseClaims(token).get("role", String.class);
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
