package com.herfree.domain.auth.entity;

import java.util.Locale;

public enum OAuthProvider {
    KAKAO,
    GOOGLE,
    NAVER;

    public static OAuthProvider fromPath(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("provider is required");
        }
        return OAuthProvider.valueOf(value.trim().toUpperCase(Locale.ROOT));
    }

    public String pathValue() {
        return name().toLowerCase(Locale.ROOT);
    }
}
