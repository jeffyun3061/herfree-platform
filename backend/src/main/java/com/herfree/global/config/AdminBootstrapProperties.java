package com.herfree.global.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.bootstrap")
public record AdminBootstrapProperties(
        boolean enabled,
        String email,
        String password,
        String nickname,
        /** 로컬 전용: 이미 있는 계정이면 SUPER_ADMIN 승격 + 비밀번호 동기화 */
        boolean syncExisting
) {
}
