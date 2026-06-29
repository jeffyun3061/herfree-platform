package com.herfree.global.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.herfree.global.response.ErrorResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * 로그인·가입 엔드포인트 IP 기준 단순 레이트 리밋 (1차 MVP — 인메모리).
 */
@Component
@RequiredArgsConstructor
public class AuthRateLimitFilter extends OncePerRequestFilter {

    private static final int MAX_ATTEMPTS_PER_WINDOW = 20;
    private static final long WINDOW_SECONDS = 60L;
    private static final MediaType JSON_UTF8 = new MediaType("application", "json", StandardCharsets.UTF_8);

    private final ObjectMapper objectMapper;
    private final Map<String, Window> windows = new ConcurrentHashMap<>();

    @Value("${app.auth-rate-limit.enabled:true}")
    private boolean rateLimitEnabled;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if (!"POST".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        String path = request.getRequestURI();
        return !"/api/auth/login".equals(path)
                && !"/api/auth/signup".equals(path)
                && !"/api/auth/password-reset/request".equals(path)
                && !"/api/auth/password-reset/confirm".equals(path);
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        if (!rateLimitEnabled) {
            filterChain.doFilter(request, response);
            return;
        }
        String clientKey = resolveClientKey(request);
        Window window = windows.compute(clientKey, (key, current) -> {
            long now = Instant.now().getEpochSecond();
            if (current == null || now - current.startEpochSecond >= WINDOW_SECONDS) {
                return new Window(now, new AtomicInteger(0));
            }
            return current;
        });

        int attempt = window.counter.incrementAndGet();
        if (attempt > MAX_ATTEMPTS_PER_WINDOW) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(JSON_UTF8.toString());
            objectMapper.writeValue(
                    response.getOutputStream(),
                    ErrorResponse.of("요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.")
            );
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String resolveClientKey(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private static final class Window {
        private final long startEpochSecond;
        private final AtomicInteger counter;

        private Window(long startEpochSecond, AtomicInteger counter) {
            this.startEpochSecond = startEpochSecond;
            this.counter = counter;
        }
    }
}
