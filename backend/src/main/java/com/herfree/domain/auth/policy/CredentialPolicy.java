package com.herfree.domain.auth.policy;

/**
 * 인증 입력 정책의 단일 기준이다.
 * 프론트엔드도 같은 값으로 선검증하지만 최종 강제는 서버가 담당한다.
 */
public final class CredentialPolicy {

    public static final int EMAIL_MAX_LENGTH = 254;
    public static final int PASSWORD_MIN_LENGTH = 15;
    public static final int PASSWORD_MAX_LENGTH = 64;

    private CredentialPolicy() {
    }
}
