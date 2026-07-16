package com.herfree.global.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.retention")
public record RetentionProperties(
        int eventDays,
        int resetTokenGraceDays,
        int adminAuditDays,
        int roleAuditDays
) {
    public RetentionProperties {
        if (eventDays <= 0 || resetTokenGraceDays < 0 || adminAuditDays <= 0 || roleAuditDays <= 0) {
            throw new IllegalArgumentException("Retention periods must be positive");
        }
    }
}
