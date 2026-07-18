package com.herfree.global.security;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class JwtTokenProviderTest {

    private final JwtTokenProvider provider = new JwtTokenProvider(
            new JwtProperties("test-jwt-secret-minimum-32-characters!!", 3600L));

    @Test
    @DisplayName("액세스 토큰은 API 인증에 통과한다")
    void validateAccessToken_accessToken_passes() {
        String token = provider.createAccessToken("1", "USER", 3);

        assertThat(provider.validateAccessToken(token)).isTrue();
        assertThat(provider.getSubject(token)).isEqualTo("1");
        assertThat(provider.getCredentialVersion(token)).isEqualTo(3);
    }

    @Test
    @DisplayName("OAuth 프로필 완성 토큰은 서명이 유효해도 API 인증에 쓸 수 없다")
    void validateAccessToken_profileCompletionToken_rejected() {
        String token = provider.createProfileCompletionToken("1");

        assertThat(provider.validateAccessToken(token)).isFalse();
        // 프로필 완성 전용 검증에는 여전히 통과해야 한다
        assertThat(provider.validateProfileCompletionToken(token)).isEqualTo(1L);
    }

    @Test
    @DisplayName("용도 claim이 없는 같은 키 서명 토큰도 액세스 토큰으로 인정하지 않는다")
    void validateAccessToken_missingPurpose_rejected() {
        String legacyToken = io.jsonwebtoken.Jwts.builder()
                .subject("1")
                .issuedAt(java.util.Date.from(java.time.Instant.now()))
                .expiration(java.util.Date.from(java.time.Instant.now().plusSeconds(3600)))
                .signWith(io.jsonwebtoken.security.Keys.hmacShaKeyFor(
                        "test-jwt-secret-minimum-32-characters!!"
                                .getBytes(java.nio.charset.StandardCharsets.UTF_8)))
                .compact();

        assertThat(provider.validateAccessToken(legacyToken)).isFalse();
    }

    @Test
    @DisplayName("위조·손상된 토큰은 거부한다")
    void validateAccessToken_garbage_rejected() {
        assertThat(provider.validateAccessToken("not-a-jwt")).isFalse();
    }
}
