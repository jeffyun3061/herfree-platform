package com.herfree.global.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // 공통 — 특정 도메인에 묶이지 않는 범용 코드
    INVALID_INPUT(HttpStatus.BAD_REQUEST, "입력값이 올바르지 않습니다."),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "인증이 필요합니다."),
    FORBIDDEN(HttpStatus.FORBIDDEN, "접근 권한이 없습니다."),
    NOT_FOUND(HttpStatus.NOT_FOUND, "리소스를 찾을 수 없습니다."),
    CONFLICT(HttpStatus.CONFLICT, "이미 존재하는 리소스입니다."),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 오류가 발생했습니다."),

    // 인증(Auth) — 회원가입·로그인·토큰 관련 오류
    // 중복 이메일은 Conflict(409)로 분리해야 클라이언트가 "이미 가입된 계정" UI를 정확히 표시할 수 있다
    DUPLICATE_EMAIL(HttpStatus.CONFLICT, "이미 사용 중인 이메일입니다."),
    // 닉네임 중복도 이메일과 동일한 이유로 Conflict 사용
    DUPLICATE_NICKNAME(HttpStatus.CONFLICT, "이미 사용 중인 닉네임입니다."),
    // 비밀번호 불일치는 403이 아닌 401 — "인증 자격증명 자체가 틀렸다"는 의미
    INVALID_PASSWORD(HttpStatus.UNAUTHORIZED, "비밀번호가 올바르지 않습니다."),
    // JWT 위조·만료 모두 401로 통일 — 클라이언트는 재로그인 유도
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "유효하지 않은 토큰입니다."),
    // 정지된 계정은 401이 아닌 403으로 처리한다.
    // 자격증명 자체는 유효하지만 서비스 접근이 금지된 상태이기 때문이다.
    // 클라이언트는 이 코드를 받으면 "계정이 정지됐습니다" 안내를 표시한다.
    SUSPENDED_ACCOUNT(HttpStatus.FORBIDDEN, "정지된 계정입니다. 운영자에게 문의하세요."),

    // 사용자(User) — 회원 조회·권한 관련 오류
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."),
    // 403은 인증은 됐지만 해당 리소스에 대한 권한이 없을 때 사용
    UNAUTHORIZED_ACCESS(HttpStatus.FORBIDDEN, "접근 권한이 없습니다.");

    private final HttpStatus httpStatus;
    private final String message;
}
