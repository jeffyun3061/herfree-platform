package com.herfree.global.config;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

class CorsConfigTest {

    private final CorsConfig corsConfig = new CorsConfig();

    @Test
    void stagingWithoutConfiguredOriginsRejectsCrossOriginRequests() {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles("staging");

        CorsConfiguration configuration = resolve(environment, "", "");

        assertThat(configuration.getAllowedOrigins()).isEmpty();
        assertThat(configuration.getAllowedOriginPatterns()).isNullOrEmpty();
    }

    @Test
    void localWithoutConfiguredOriginsAllowsLocalDevelopmentPatterns() {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles("local");

        CorsConfiguration configuration = resolve(environment, "", "");

        assertThat(configuration.getAllowedOriginPatterns()).contains("http://localhost:*");
    }

    private CorsConfiguration resolve(MockEnvironment environment, String origins, String patterns) {
        UrlBasedCorsConfigurationSource source = (UrlBasedCorsConfigurationSource)
                corsConfig.corsConfigurationSource(environment, origins, patterns);
        CorsConfiguration configuration = source.getCorsConfiguration(
                new MockHttpServletRequest("GET", "/api/health"));
        assertThat(configuration).isNotNull();
        return configuration;
    }
}
