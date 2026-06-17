package com.herfree.global.config;

import java.util.Arrays;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.util.StringUtils;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class CorsConfig {

    private static final List<String> LOCAL_ORIGIN_PATTERNS = List.of(
            "http://localhost:*",
            "http://127.0.0.1:*",
            "http://192.168.*.*:*",
            "http://10.*.*.*:*",
            "https://*.ngrok-free.dev",
            "https://*.ngrok-free.app",
            "https://*.ngrok.io",
            "https://*.vercel.app"
    );

    @Bean
    public CorsConfigurationSource corsConfigurationSource(
            Environment environment,
            @Value("${app.cors.allowed-origins:}") String allowedOrigins,
            @Value("${app.cors.allowed-origin-patterns:}") String allowedOriginPatterns
    ) {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of("Content-Type"));
        configuration.setAllowCredentials(false);
        configuration.setMaxAge(3600L);

        if (StringUtils.hasText(allowedOriginPatterns)) {
            configuration.setAllowedOriginPatterns(splitCsv(allowedOriginPatterns));
        } else if (StringUtils.hasText(allowedOrigins)) {
            configuration.setAllowedOrigins(splitCsv(allowedOrigins));
        } else if (Arrays.asList(environment.getActiveProfiles()).contains("prod")) {
            configuration.setAllowedOrigins(List.of());
        } else {
            configuration.setAllowedOriginPatterns(LOCAL_ORIGIN_PATTERNS);
        }

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }

    private static List<String> splitCsv(String value) {
        return Arrays.stream(value.split(","))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .toList();
    }
}
