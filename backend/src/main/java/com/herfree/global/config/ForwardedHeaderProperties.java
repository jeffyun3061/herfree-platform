package com.herfree.global.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.forwarded-headers")
public record ForwardedHeaderProperties(
        String trustedProxyCidrs
) {
}
