package com.herfree.global.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Network gate for administrator APIs. Public profiles must configure a VPN/admin CIDR. */
@ConfigurationProperties(prefix = "app.admin")
public record AdminAccessProperties(
        String accessAllowedCidrs
) {
}
