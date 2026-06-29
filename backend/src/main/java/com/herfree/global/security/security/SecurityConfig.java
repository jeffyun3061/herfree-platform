package com.herfree.global.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.herfree.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    private final RestAuthenticationEntryPoint restAuthenticationEntryPoint;
    private final RestAccessDeniedHandler restAccessDeniedHandler;
    private final AuthRateLimitFilter authRateLimitFilter;
    private final org.springframework.web.cors.CorsConfigurationSource corsConfigurationSource;
    private final Environment environment;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter() {
        return new JwtAuthenticationFilter(jwtTokenProvider, userRepository, objectMapper);
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        boolean isProd = Arrays.asList(environment.getActiveProfiles()).contains("prod");

        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
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
                                        .ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN)));

        http.authorizeHttpRequests(auth -> {
            auth.requestMatchers(HttpMethod.OPTIONS, "/api/**").permitAll()
                    .requestMatchers(
                            "/api/auth/signup",
                            "/api/auth/login",
                            "/api/auth/password-reset/request",
                            "/api/auth/password-reset/confirm",
                            "/api/health"
                    ).permitAll();

            if (!isProd) {
                auth.requestMatchers(
                        "/v3/api-docs/**",
                        "/swagger-ui/**",
                        "/swagger-ui.html"
                ).permitAll();
            }

            auth.requestMatchers("/actuator/health").permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/posts/bookmarks").authenticated()
                    .requestMatchers(
                            HttpMethod.GET,
                            "/api/boards",
                            "/api/posts",
                            "/api/posts/{postId:\\d+}",
                            "/api/posts/{postId:\\d+}/comments",
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
                    .anyRequest().authenticated();
        });

        http
                .addFilterBefore(authRateLimitFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
