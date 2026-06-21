package com.herfree.domain.auth.service;

import com.herfree.domain.auth.exception.LoginLockedException;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

/**
 * 로그인 실패 횟수 기반 잠금 (1차 MVP — 인메모리, 이메일 단위).
 * 10회 연속 실패 시 30분 동안 해당 이메일 로그인을 차단한다.
 */
@Service
public class LoginLockoutService {

    public static final int MAX_FAILURES = 10;
    public static final long LOCKOUT_SECONDS = 30L * 60L;

    private final Map<String, AttemptState> attempts = new ConcurrentHashMap<>();

    public void assertNotLocked(String email) {
        String key = normalizeEmail(email);
        AttemptState state = attempts.get(key);
        if (state == null) {
            return;
        }

        long now = Instant.now().getEpochSecond();
        if (state.lockedUntilEpochSecond > now) {
            throw new LoginLockedException();
        }

        if (state.lockedUntilEpochSecond > 0 && state.lockedUntilEpochSecond <= now) {
            attempts.remove(key);
        }
    }

    public void recordFailure(String email) {
        String key = normalizeEmail(email);
        long now = Instant.now().getEpochSecond();

        attempts.compute(key, (ignored, current) -> {
            AttemptState state = current;
            if (state == null || (state.lockedUntilEpochSecond > 0 && state.lockedUntilEpochSecond <= now)) {
                state = new AttemptState(0, 0);
            }

            int failures = state.failureCount + 1;
            long lockedUntil = failures >= MAX_FAILURES ? now + LOCKOUT_SECONDS : 0;
            return new AttemptState(failures, lockedUntil);
        });
    }

    public boolean isLocked(String email) {
        String key = normalizeEmail(email);
        AttemptState state = attempts.get(key);
        if (state == null) {
            return false;
        }
        return state.lockedUntilEpochSecond > Instant.now().getEpochSecond();
    }

    public void clearFailures(String email) {
        attempts.remove(normalizeEmail(email));
    }

    private static String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private record AttemptState(int failureCount, long lockedUntilEpochSecond) {
    }
}
