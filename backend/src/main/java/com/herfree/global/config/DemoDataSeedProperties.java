package com.herfree.global.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.demo-seed")
public record DemoDataSeedProperties(
        boolean enabled,
        String password
) {
    public String resolvedPassword() {
        return (password != null && !password.isBlank()) ? password : "Demo1234!";
    }
}
