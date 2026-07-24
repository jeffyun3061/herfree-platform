package com.herfree.domain.auth.service;

import com.herfree.domain.user.exception.CurrentPasswordLockedException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

/**
 * 비밀번호 변경 시 현재 비밀번호 확인 실패 횟수 기반 잠금 (1차 MVP — 인메모리, userId 단위).
 * 탈취된 JWT로 현재 비밀번호를 무차별 대입하는 공격을 완화한다.
 */
@Service
public class CurrentPasswordLockoutService {

    public static final int MAX_FAILURES = 10;
    public static final long LOCKOUT_SECONDS = 30L * 60L;

    private final Map<Long, AttemptState> attempts = new ConcurrentHashMap<>();

    public void assertNotLocked(Long userId) {
        AttemptState state = attempts.get(userId);
        if (state == null) {
            return;
        }

        long now = Instant.now().getEpochSecond();
        if (state.lockedUntilEpochSecond() > now) {
            throw new CurrentPasswordLockedException();
        }

        if (state.lockedUntilEpochSecond() > 0 && state.lockedUntilEpochSecond() <= now) {
            attempts.remove(userId);
        }
    }

    public void recordFailure(Long userId) {
        long now = Instant.now().getEpochSecond();

        attempts.compute(userId, (ignored, current) -> {
            AttemptState state = current;
            if (state == null || (state.lockedUntilEpochSecond() > 0 && state.lockedUntilEpochSecond() <= now)) {
                state = new AttemptState(0, 0);
            }

            int failures = state.failureCount() + 1;
            long lockedUntil = failures >= MAX_FAILURES ? now + LOCKOUT_SECONDS : 0;
            return new AttemptState(failures, lockedUntil);
        });
    }

    public void clearFailures(Long userId) {
        attempts.remove(userId);
    }

    private record AttemptState(int failureCount, long lockedUntilEpochSecond) {
    }
}
