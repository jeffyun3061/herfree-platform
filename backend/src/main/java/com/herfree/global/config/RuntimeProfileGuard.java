package com.herfree.global.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class RuntimeProfileGuard {

    private final Environment environment;

    @PostConstruct
    void validateProfile() {
        // 배포 설정 누락을 로컬 기본값으로 숨기지 않고 서버 시작 단계에서 즉시 차단한다.
        RuntimeProfilePolicy.requireExplicitSingleProfile(environment);
        RuntimeProfilePolicy.requirePublicDeploymentSettings(environment);
    }
}
