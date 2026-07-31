package com.herfree.global.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.herfree.global.response.ErrorResponse;
import com.herfree.global.util.ClientIpExtractor;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
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

/** Application-side backstop for anonymous analytics ingestion floods. */
@Component
@RequiredArgsConstructor
public class AnalyticsRateLimitFilter extends OncePerRequestFilter {

    private static final int MAX_EVENTS_PER_MINUTE = 60;
    private static final long WINDOW_SECONDS = 60;

    private final ObjectMapper objectMapper;
    private final ClientIpExtractor clientIpExtractor;
    private final Map<String, Window> windows = new ConcurrentHashMap<>();

    @Value("${app.analytics.rate-limit-enabled:true}")
    private boolean enabled = true;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !"POST".equalsIgnoreCase(request.getMethod())
                || !"/api/events".equals(request.getRequestURI());
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        if (!enabled) {
            filterChain.doFilter(request, response);
            return;
        }
        long now = Instant.now().getEpochSecond();
        Window window = windows.compute(clientIpExtractor.extract(request), (key, current) ->
                current == null || now - current.startedAt >= WINDOW_SECONDS
                        ? new Window(now, new AtomicInteger())
                        : current);
        if (window.count.incrementAndGet() > MAX_EVENTS_PER_MINUTE) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            objectMapper.writeValue(response.getOutputStream(), ErrorResponse.of("Too many event requests."));
            return;
        }
        filterChain.doFilter(request, response);
    }

    private record Window(long startedAt, AtomicInteger count) {
    }
}
