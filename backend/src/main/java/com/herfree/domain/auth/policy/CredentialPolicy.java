package com.herfree.domain.auth.policy;

/**
 * 인증 입력 정책의 단일 기준이다.
 * 프론트엔드 {@code domain/auth/validate.ts}도 같은 값으로 선검증하지만 최종 강제는 서버가 담당한다.
 */
public final class CredentialPolicy {

    public static final int EMAIL_MAX_LENGTH = 254;
    public static final int PASSWORD_MIN_LENGTH = 10;
    /** 신규·변경·로그인·현재 비밀번호 입력 모두 동일 상한 */
    public static final int PASSWORD_MAX_LENGTH = 24;

    /** 영문·숫자 외 문자 1개 이상 (특수문자) */
    public static final String PASSWORD_SPECIAL_CHAR_PATTERN = ".*[^A-Za-z0-9].*";

    public static final String PASSWORD_LENGTH_MESSAGE =
            "비밀번호는 10자 이상 24자 이하여야 합니다.";
    public static final String PASSWORD_SPECIAL_CHAR_MESSAGE =
            "비밀번호에 특수문자(!, @, # 등)를 하나 이상 포함해 주세요.";

    private CredentialPolicy() {
    }
}
