package com.herfree.global.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.herfree.global.response.ErrorResponse;
import com.herfree.global.util.ClientIpExtractor;
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
 * 로그인·가입·재설정·비밀번호 변경 엔드포인트 IP 기준 레이트 리밋 (1차 MVP — 인메모리).
 */
@Component
@RequiredArgsConstructor
public class AuthRateLimitFilter extends OncePerRequestFilter {

    private static final int MAX_ATTEMPTS_PER_WINDOW = 20;
    private static final int MAX_TRACKED_CLIENTS = 10_000;
    private static final int CLEANUP_THRESHOLD = 2_000;
    private static final long WINDOW_SECONDS = 60L;
    private static final MediaType JSON_UTF8 = new MediaType("application", "json", StandardCharsets.UTF_8);

    private final ObjectMapper objectMapper;
    private final ClientIpExtractor clientIpExtractor;
    private final Map<String, Window> windows = new ConcurrentHashMap<>();

    @Value("${app.auth-rate-limit.enabled:true}")
    private boolean rateLimitEnabled;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        boolean isPost = "POST".equalsIgnoreCase(request.getMethod());
        boolean isPatch = "PATCH".equalsIgnoreCase(request.getMethod());
        if (!isPost && !isPatch) {
            return true;
        }
        String path = request.getRequestURI();
        return !(isPatch && "/api/users/me/password".equals(path))
                && !"/api/auth/login".equals(path)
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
        if (!org.springframework.util.StringUtils.hasText(clientKey)) {
            clientKey = "unknown-client";
        }
        long now = Instant.now().getEpochSecond();
        if (windows.size() >= CLEANUP_THRESHOLD) {
            windows.entrySet().removeIf(entry -> now - entry.getValue().startEpochSecond >= WINDOW_SECONDS);
        }
        if (!windows.containsKey(clientKey) && windows.size() >= MAX_TRACKED_CLIENTS) {
            writeTooManyRequests(response);
            return;
        }
        Window window = windows.compute(clientKey, (key, current) -> {
            if (current == null || now - current.startEpochSecond >= WINDOW_SECONDS) {
                return new Window(now, new AtomicInteger(0));
            }
            return current;
        });

        int attempt = window.counter.incrementAndGet();
        if (attempt > MAX_ATTEMPTS_PER_WINDOW) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setHeader("Retry-After", String.valueOf(WINDOW_SECONDS));
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
        return clientIpExtractor.extract(request);
    }

    private void writeTooManyRequests(HttpServletResponse response) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setHeader("Retry-After", String.valueOf(WINDOW_SECONDS));
        response.setContentType(JSON_UTF8.toString());
        objectMapper.writeValue(
                response.getOutputStream(),
                ErrorResponse.of("Too many requests. Please retry later.")
        );
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
