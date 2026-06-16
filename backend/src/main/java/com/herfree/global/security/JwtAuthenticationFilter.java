package com.herfree.global.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import com.herfree.global.util.StaffRolePolicy;
import com.herfree.domain.user.entity.UserRole;

// JWT를 검증하고 SecurityContext에 인증 정보를 등록하는 필터
// OncePerRequestFilter를 상속하는 이유:
// 같은 요청 내에서 필터가 두 번 실행되는 것을 방지한다 (forward, include 등).
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String token = extractToken(request);

        // 토큰이 있고 유효한 경우에만 SecurityContext에 인증 정보를 설정한다.
        // 없거나 유효하지 않으면 그냥 통과 — 인가는 SecurityConfig의 authorizeHttpRequests에서 처리된다.
        if (StringUtils.hasText(token) && jwtTokenProvider.validateToken(token)) {
            // subject에 저장한 userId를 꺼내 Long으로 변환한다.
            // UserDetailsService를 거치지 않는 이유:
            // 매 요청마다 DB 조회를 하면 성능 비용이 크고,
            // userId 하나만 있어도 비즈니스 로직에서 필요한 정보를 충분히 조회할 수 있다.
            Long userId = Long.parseLong(jwtTokenProvider.getSubject(token));

            // JWT claim에서 role을 꺼내 실제 권한을 SecurityContext에 반영한다.
            // role claim이 없는 구버전 토큰을 방어하기 위해 null 시 USER 기본값을 사용한다.
            String role = jwtTokenProvider.getRole(token);
            UserRole userRole = parseRole(role);
            var authorities = StaffRolePolicy.resolveAuthorities(userRole).stream()
                    .map(SimpleGrantedAuthority::new)
                    .toList();

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(userId, null, authorities);

            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }

    private UserRole parseRole(String role) {
        if (!StringUtils.hasText(role)) {
            return UserRole.USER;
        }
        try {
            return UserRole.valueOf(role);
        } catch (IllegalArgumentException ex) {
            return UserRole.USER;
        }
    }

    // Authorization 헤더에서 "Bearer " 접두사를 제거하고 토큰 문자열만 반환한다.
    private String extractToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (StringUtils.hasText(header) && header.startsWith(BEARER_PREFIX)) {
            return header.substring(BEARER_PREFIX.length());
        }
        return null;
    }
}
