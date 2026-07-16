package com.herfree.global.security;

import com.herfree.domain.audit.service.AdminAuditService;
import com.herfree.global.web.RequestCorrelationFilter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

@Slf4j
@RequiredArgsConstructor
public class AdminAuditFilter extends OncePerRequestFilter {

    private static final Set<String> MUTATING_METHODS = Set.of("POST", "PUT", "PATCH", "DELETE");
    private final AdminAuditService adminAuditService;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/api/admin/")
                || !MUTATING_METHODS.contains(request.getMethod());
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        filterChain.doFilter(request, response);

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof Long actorUserId)) {
            return;
        }

        String requestId = String.valueOf(request.getAttribute(RequestCorrelationFilter.ATTRIBUTE));
        try {
            // 요청 본문과 쿼리는 저장하지 않아 운영 추적과 민감정보 최소 수집을 함께 지킨다.
            adminAuditService.record(
                    actorUserId,
                    request.getMethod(),
                    request.getRequestURI(),
                    response.getStatus(),
                    requestId
            );
        } catch (RuntimeException ex) {
            log.error("Failed to persist admin audit event requestId={}", requestId, ex);
        }
    }
}
