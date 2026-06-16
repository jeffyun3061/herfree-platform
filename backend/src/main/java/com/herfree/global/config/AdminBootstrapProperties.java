package com.herfree.global.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.bootstrap")
public record AdminBootstrapProperties(
        boolean enabled,
        String email,
        String password,
        String nickname
) {
}
