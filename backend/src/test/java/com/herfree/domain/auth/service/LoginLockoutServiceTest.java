package com.herfree.domain.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.herfree.domain.auth.exception.LoginLockedException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class LoginLockoutServiceTest {

    private LoginLockoutService loginLockoutService;

    @BeforeEach
    void setUp() {
        loginLockoutService = new LoginLockoutService();
    }

    @Test
    @DisplayName("로그인 10회 연속 실패 시 30분 잠금된다")
    void recordFailure_locksAfterTenAttempts() {
        String email = "user@example.com";

        for (int i = 0; i < LoginLockoutService.MAX_FAILURES - 1; i++) {
            loginLockoutService.recordFailure(email);
            assertThat(loginLockoutService.isLocked(email)).isFalse();
        }

        loginLockoutService.recordFailure(email);
        assertThat(loginLockoutService.isLocked(email)).isTrue();
        assertThatThrownBy(() -> loginLockoutService.assertNotLocked(email))
                .isInstanceOf(LoginLockedException.class);
    }

    @Test
    @DisplayName("로그인 성공 시 실패 카운트가 초기화된다")
    void clearFailures_resetsCounter() {
        String email = "user@example.com";

        for (int i = 0; i < 5; i++) {
            loginLockoutService.recordFailure(email);
        }

        loginLockoutService.clearFailures(email);

        assertThat(loginLockoutService.isLocked(email)).isFalse();
        loginLockoutService.assertNotLocked(email);
    }
}
