package com.herfree.global.web;

import com.herfree.domain.operations.RequestDiagnostics;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.servlet.HandlerMapping;

@Component
@RequiredArgsConstructor
@Slf4j
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class RequestDiagnosticsFilter extends OncePerRequestFilter {
    private final RequestDiagnostics diagnostics;

    @Override protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/api/")
                || request.getRequestURI().startsWith("/api/admin/developer/");
    }

    @Override protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
            FilterChain chain) throws ServletException, IOException {
        long start = System.nanoTime();
        boolean failed = true;
        try { chain.doFilter(request, response); failed = false; }
        finally {
            long elapsed = (System.nanoTime() - start) / 1_000_000;
            int status = failed ? 500 : response.getStatus();
            // A framework route template omits IDs, emails, search terms and opaque URL tokens.
            Object pattern = request.getAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE);
            String route = pattern instanceof String value && value.startsWith("/api/") ? value : "UNMAPPED";
            String id = String.valueOf(request.getAttribute(RequestCorrelationFilter.ATTRIBUTE));
            diagnostics.record(id, request.getMethod(), route, status, elapsed);
            if (status >= 500 || elapsed >= 2000) {
                log.warn("Request diagnostic requestId={} route={} status={} durationMs={}", id, route, status, elapsed);
            }
        }
    }
}
