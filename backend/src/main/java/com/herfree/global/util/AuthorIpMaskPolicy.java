package com.herfree.global.util;

import org.springframework.util.StringUtils;

public final class AuthorIpMaskPolicy {

    private AuthorIpMaskPolicy() {
    }

    /**
     * 커뮤니티 게시글에 노출할 IP 마스킹 값.
     * IPv4: 앞 두 옥텟만 노출 (예: 123.45.*)
     */
    public static String mask(String ip) {
        if (!StringUtils.hasText(ip)) {
            return null;
        }
        String trimmed = ip.trim();
        if ("127.0.0.1".equals(trimmed) || "::1".equals(trimmed)) {
            return "local";
        }
        if (trimmed.contains(".")) {
            String[] parts = trimmed.split("\\.");
            if (parts.length == 4) {
                return parts[0] + "." + parts[1] + ".*";
            }
        }
        if (trimmed.contains(":")) {
            String[] parts = trimmed.split(":");
            if (parts.length >= 2
                    && StringUtils.hasText(parts[0])
                    && StringUtils.hasText(parts[1])) {
                return parts[0] + ":" + parts[1] + ":*";
            }
        }
        return null;
    }
}
