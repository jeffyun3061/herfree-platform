package com.herfree.global.security;

import com.herfree.global.config.AdminAccessProperties;
import com.herfree.global.config.RuntimeProfilePolicy;
import com.herfree.global.util.ClientIpExtractor;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

/** Blocks public admin APIs unless the request originated from the configured admin/VPN CIDR. */
@Component
@RequiredArgsConstructor
public class AdminAccessGateFilter extends OncePerRequestFilter {

    private final Environment environment;
    private final AdminAccessProperties properties;
    private final ClientIpExtractor clientIpExtractor;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/api/admin/")
                || "OPTIONS".equalsIgnoreCase(request.getMethod())
                || !RuntimeProfilePolicy.isPublicEnvironment(environment);
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        // The frontend production BFF forwards the authenticated access token, but its
        // server-side request IP is not the end user's IP. Let that request continue to
        // Spring Security, which still enforces the ADMIN/SUPER_ADMIN role below. Requests
        // without a bearer token remain subject to the configured admin/VPN CIDR gate.
        if (hasBearerToken(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        String allowedCidrs = properties.accessAllowedCidrs();
        String clientIp = clientIpExtractor.extract(request);
        if (!StringUtils.hasText(allowedCidrs)
                || !clientIpExtractor.matchesAnyCidr(clientIp, allowedCidrs)) {
            response.sendError(HttpStatus.FORBIDDEN.value(), "Administrator access is restricted");
            return;
        }
        filterChain.doFilter(request, response);
    }

    private boolean hasBearerToken(HttpServletRequest request) {
        String authorization = request.getHeader("Authorization");
        return StringUtils.hasText(authorization)
                && authorization.regionMatches(true, 0, "Bearer ", 0, 7)
                && StringUtils.hasText(authorization.substring(7));
    }
}
