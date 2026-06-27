package com.herfree.global.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtTokenProvider jwtTokenProvider;
    private final RestAuthenticationEntryPoint restAuthenticationEntryPoint;
    private final RestAccessDeniedHandler restAccessDeniedHandler;
    private final AuthRateLimitFilter authRateLimitFilter;
    private final org.springframework.web.cors.CorsConfigurationSource corsConfigurationSource;

    // PasswordEncoder를 SecurityConfig에 두는 이유:
    // Spring Security 컨텍스트 내에서 정의해 순환 의존성을 방지한다.
    // AuthService가 PasswordEncoder를 주입받을 때 Security 초기화 순서 문제가 생기지 않는다.
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter() {
        return new JwtAuthenticationFilter(jwtTokenProvider);
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                // REST API는 CSRF 토큰이 필요 없다 — Stateless 구조에서 세션이 없으므로 CSRF 공격이 불가능하다
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(restAuthenticationEntryPoint)
                        .accessDeniedHandler(restAccessDeniedHandler))
                .headers(headers -> headers
                        .contentTypeOptions(contentType -> {})
                        .frameOptions(frame -> frame.deny())
                        .xssProtection(xss -> xss.headerValue(
                                org.springframework.security.web.header.writers.XXssProtectionHeaderWriter
                                        .HeaderValue.ENABLED_MODE_BLOCK))
                        .referrerPolicy(referrer -> referrer.policy(
                                org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter
                                        .ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN)))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/api/**").permitAll()
                        // 인증 없이 접근 가능한 경로 — signup과 login만 열어둔다.
                        // /api/auth/logout은 인증된 사용자만 호출할 수 있도록 여기서 제외한다.
                        // 이유: 비인증 요청이 logout 엔드포인트를 반복 호출하는 DoS를 방지하고,
                        //      추후 토큰 블랙리스트(Redis) 도입 시 실제 사용자의 토큰만 무효화해야 하기 때문이다.
                        .requestMatchers(
                                "/api/auth/signup",
                                "/api/auth/login",
                                "/api/events",
                                "/api/health",
                                "/actuator/health",
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html"
                        ).permitAll()
                        // 게시판·게시글·콘텐츠·영상·제품의 조회 엔드포인트는 비로그인 접근 허용
                        // GET 메서드만 열어두고 나머지(POST, PATCH, DELETE)는 인증 필요
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/boards",
                                "/api/posts",
                                "/api/posts/*",
                                "/api/posts/*/comments",
                                "/api/posts/images/object/**",
                                "/api/contents",
                                "/api/contents/*",
                                "/api/videos",
                                "/api/videos/*",
                                "/api/products",
                                "/api/products/*",
                                "/api/reactions/summary",
                                "/api/journal/insights",
                                "/api/journal/public/home-stats"
                        ).permitAll()
                        // 권한별 관리 API — 구체 경로를 먼저 매칭한다
                        .requestMatchers(HttpMethod.PATCH, "/api/admin/users/*/role").hasRole("SUPER_ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/admin/users/*/status")
                        .hasAnyRole("ADMIN", "SUPER_ADMIN")
                        .requestMatchers("/api/admin/users/**").hasAnyRole("ADMIN", "SUPER_ADMIN")
                        .requestMatchers("/api/admin/reports/**")
                        .hasAnyRole("MODERATOR", "ADMIN", "SUPER_ADMIN")
                        .requestMatchers("/api/admin/posts/**", "/api/admin/comments/**")
                        .hasAnyRole("MODERATOR", "ADMIN", "SUPER_ADMIN")
                        .requestMatchers("/api/admin/contents/**")
                        .hasAnyRole("MODERATOR", "ADMIN", "SUPER_ADMIN", "DOCTOR", "CREATOR")
                        .requestMatchers("/api/admin/**").hasAnyRole("ADMIN", "SUPER_ADMIN")
                        // 나머지 모든 요청은 인증 필요 — /api/auth/logout 포함
                        .anyRequest().authenticated())
                // UsernamePasswordAuthenticationFilter 앞에 JWT 필터를 추가한다.
                // 이 위치에 놓는 이유:
                // Spring Security 필터 체인에서 UsernamePasswordAuthenticationFilter는
                // 폼 로그인 처리를 담당한다. JWT 필터가 그 앞에서 먼저 인증을 완료하면
                // 이후 Security 필터들이 이미 설정된 SecurityContext를 그대로 사용한다.
                .addFilterBefore(authRateLimitFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class)
                .build();
    }
}
