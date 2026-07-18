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

    private static final String ACCESS_TOKEN_PURPOSE = "access";
    private static final String PROFILE_COMPLETION_PURPOSE = "oauth_profile";
    private static final String CREDENTIAL_VERSION_CLAIM = "credentialVersion";
    private static final long PROFILE_COMPLETION_EXPIRATION_SECONDS = 900L;

    private final JwtProperties jwtProperties;
    private final SecretKey secretKey;

    public JwtTokenProvider(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
        this.secretKey = Keys.hmacShaKeyFor(jwtProperties.secret().getBytes(StandardCharsets.UTF_8));
    }

    // role claim은 토큰 문맥과 하위 호환을 위해 유지한다.
    // 실제 인가 권한은 JwtAuthenticationFilter가 매 요청 DB에서 읽어 역할 변경을 즉시 반영한다.
    public String createAccessToken(String subject, String role, int credentialVersion) {
        Instant now = Instant.now();
        Instant expiry = now.plusSeconds(jwtProperties.accessExpirationSeconds());

        return Jwts.builder()
                .subject(subject)
                .claim("role", role)
                .claim("purpose", ACCESS_TOKEN_PURPOSE)
                .claim(CREDENTIAL_VERSION_CLAIM, credentialVersion)
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

    /**
     * API 접근용 액세스 토큰만 통과시킨다.
     * 같은 서명 키를 쓰더라도 명시적으로 access 용도로 발급한 토큰만 API 인증에 사용한다.
     * 용도 claim이 없거나 OAuth 프로필 완성용인 토큰은 거부한다.
     */
    public boolean validateAccessToken(String token) {
        try {
            return ACCESS_TOKEN_PURPOSE.equals(parseClaims(token).get("purpose", String.class));
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

    public int getCredentialVersion(String token) {
        Integer version = parseClaims(token).get(CREDENTIAL_VERSION_CLAIM, Integer.class);
        // 배포 전 발급된 토큰은 기존 계정의 기본 버전 0으로 취급한다.
        return version == null ? 0 : version;
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
