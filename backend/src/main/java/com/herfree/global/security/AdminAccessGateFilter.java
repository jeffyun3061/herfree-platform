package com.herfree.global.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.herfree.domain.auth.mfa.AdminMfaService;
import com.herfree.global.config.RuntimeProfilePolicy;
import com.herfree.global.exception.ErrorCode;
import com.herfree.global.response.ErrorResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import org.springframework.core.env.Environment;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

/** Runs after JWT authentication; a bearer token alone never supplies the second factor. */
@RequiredArgsConstructor
public class AdminAccessGateFilter extends OncePerRequestFilter {

    private final Environment environment;
    private final AdminMfaService mfa;
    private final ObjectMapper mapper;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return !(path.startsWith("/api/admin/") || privilegedCommunityPath(path))
                || "OPTIONS".equalsIgnoreCase(request.getMethod())
                || (!RuntimeProfilePolicy.isPublicEnvironment(environment)
                    && !environment.getProperty("app.admin.mfa.required", Boolean.class, true));
    }

    // Operators can read private inquiries and write official replies through
    // the community API too. A URL outside /admin must not bypass their MFA.
    static boolean privilegedCommunityPath(String path) {
        return path.equals("/api/posts") || path.startsWith("/api/posts/")
                || path.startsWith("/api/comments/");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean staff = auth != null && auth.getAuthorities().stream().anyMatch(a ->
                java.util.Set.of("ROLE_MODERATOR", "ROLE_ADMIN", "ROLE_SUPER_ADMIN", "ROLE_DOCTOR", "ROLE_CREATOR", "ROLE_DEVELOPER")
                        .contains(a.getAuthority()));
        if (privilegedCommunityPath(request.getRequestURI())) {
            staff = auth != null && auth.getAuthorities().stream().anyMatch(a ->
                    java.util.Set.of("ROLE_MODERATOR", "ROLE_ADMIN", "ROLE_SUPER_ADMIN").contains(a.getAuthority()));
        }
        if (staff) {
            String authorization = request.getHeader("Authorization");
            String access = authorization != null && authorization.startsWith("Bearer ")
                    ? authorization.substring(7) : null;
            if (!(auth.getPrincipal() instanceof Number id)
                    || !mfa.verified(id.longValue(), access, request.getHeader("X-Herfree-Admin-MFA"))) {
                response.setStatus(403);
                response.setContentType("application/json;charset=UTF-8");
                response.setHeader("Cache-Control", "private, no-store");
                mapper.writeValue(response.getOutputStream(), ErrorResponse.of(ErrorCode.ADMIN_MFA_REQUIRED));
                return;
            }
        }
        filterChain.doFilter(request, response);
    }

}
