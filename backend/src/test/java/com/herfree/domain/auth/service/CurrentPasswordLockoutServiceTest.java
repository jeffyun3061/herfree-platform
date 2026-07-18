package com.herfree.domain.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.herfree.domain.user.exception.CurrentPasswordLockedException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class CurrentPasswordLockoutServiceTest {

    private CurrentPasswordLockoutService lockoutService;

    @BeforeEach
    void setUp() {
        lockoutService = new CurrentPasswordLockoutService();
    }

    @Test
    @DisplayName("현재 비밀번호 10회 연속 실패 시 30분 잠금된다")
    void recordFailure_locksAfterTenAttempts() {
        Long userId = 42L;

        for (int i = 0; i < CurrentPasswordLockoutService.MAX_FAILURES - 1; i++) {
            lockoutService.recordFailure(userId);
        }

        lockoutService.recordFailure(userId);
        assertThatThrownBy(() -> lockoutService.assertNotLocked(userId))
                .isInstanceOf(CurrentPasswordLockedException.class);
    }

    @Test
    @DisplayName("비밀번호 변경 성공 시 실패 카운트가 초기화된다")
    void clearFailures_resetsCounter() {
        Long userId = 42L;

        for (int i = 0; i < 5; i++) {
            lockoutService.recordFailure(userId);
        }

        lockoutService.clearFailures(userId);
        lockoutService.assertNotLocked(userId);
    }
}
