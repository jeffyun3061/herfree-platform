package com.herfree.global.security;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

class MigratingPasswordEncoderTest {

    private final MigratingPasswordEncoder encoder = new MigratingPasswordEncoder();

    @Test
    @DisplayName("신규 비밀번호는 현재 형식으로 인코딩하고 전체 입력을 검증한다")
    void encodeAndMatchCurrentPassword() {
        String password = "한글과 공백을 포함한 충분히 긴 비밀번호 문장 123!";
        String encoded = encoder.encode(password);

        assertThat(encoded).startsWith("{bcrypt-sha256}");
        assertThat(encoder.matches(password, encoded)).isTrue();
        assertThat(encoder.matches(password + "x", encoded)).isFalse();
        assertThat(encoder.upgradeEncoding(encoded)).isFalse();
    }

    @Test
    @DisplayName("기존 BCrypt 비밀번호는 검증하되 업그레이드 대상으로 표시한다")
    void matchLegacyBcryptPassword() {
        String password = "legacy-password";
        String encoded = new BCryptPasswordEncoder().encode(password);

        assertThat(encoder.matches(password, encoded)).isTrue();
        assertThat(encoder.matches("wrong-password", encoded)).isFalse();
        assertThat(encoder.upgradeEncoding(encoded)).isTrue();
    }
}
