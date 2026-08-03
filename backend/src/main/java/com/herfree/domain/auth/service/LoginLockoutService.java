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
    private static final int MAX_TRACKED_KEYS = 10_000;
    private static final int CLEANUP_THRESHOLD = 2_000;

    private final Map<String, AttemptState> attempts = new ConcurrentHashMap<>();

    public void assertNotLocked(String email) {
        String key = normalizeEmail(email);
        AttemptState state = attempts.get(key);
        if (state == null) {
            return;
        }

        long now = Instant.now().getEpochSecond();
        if (now - state.lastFailureEpochSecond > LOCKOUT_SECONDS) {
            attempts.remove(key, state);
            return;
        }
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
        if (attempts.size() >= CLEANUP_THRESHOLD) {
            attempts.entrySet().removeIf(entry -> now - entry.getValue().lastFailureEpochSecond > LOCKOUT_SECONDS);
        }
        if (!attempts.containsKey(key) && attempts.size() >= MAX_TRACKED_KEYS) {
            return;
        }

        attempts.compute(key, (ignored, current) -> {
            AttemptState state = current;
            if (state == null || now - state.lastFailureEpochSecond > LOCKOUT_SECONDS
                    || (state.lockedUntilEpochSecond > 0 && state.lockedUntilEpochSecond <= now)) {
                state = new AttemptState(0, 0, now);
            }

            int failures = state.failureCount + 1;
            long lockedUntil = failures >= MAX_FAILURES ? now + LOCKOUT_SECONDS : 0;
            return new AttemptState(failures, lockedUntil, now);
        });
    }

    public boolean isLocked(String email) {
        String key = normalizeEmail(email);
        AttemptState state = attempts.get(key);
        if (state == null) {
            return false;
        }
        long now = Instant.now().getEpochSecond();
        if (now - state.lastFailureEpochSecond > LOCKOUT_SECONDS) {
            attempts.remove(key, state);
            return false;
        }
        return state.lockedUntilEpochSecond > now;
    }

    public void clearFailures(String email) {
        attempts.remove(normalizeEmail(email));
    }

    private static String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private record AttemptState(int failureCount, long lockedUntilEpochSecond, long lastFailureEpochSecond) {
    }
}
