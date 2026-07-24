package com.herfree.global.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.demo-seed")
public record DemoDataSeedProperties(
        boolean enabled,
        String password,
        /** 로컬 전용: demo*.local 계정이 이미 있으면 비밀번호를 설정값으로 재동기화 */
        boolean syncExisting
) {
    public String resolvedPassword() {
        return (password != null && !password.isBlank()) ? password : "Demo1234!";
    }
}
