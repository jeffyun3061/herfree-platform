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
        String allowedCidrs = properties.accessAllowedCidrs();
        String clientIp = clientIpExtractor.extract(request);
        if (!StringUtils.hasText(allowedCidrs)
                || !clientIpExtractor.matchesAnyCidr(clientIp, allowedCidrs)) {
            response.sendError(HttpStatus.FORBIDDEN.value(), "Administrator access is restricted");
            return;
        }
        filterChain.doFilter(request, response);
    }
}
