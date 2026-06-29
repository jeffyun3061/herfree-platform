package com.herfree.domain.auth.exception;

import com.herfree.global.exception.BusinessException;
import com.herfree.global.exception.ErrorCode;

// 정지된 계정으로 로그인을 시도할 때 발생하는 예외
// InvalidPasswordException, UserNotFoundException과 구분하는 이유:
// 정지 상태는 자격증명은 올바르지만 서비스 접근이 금지된 케이스로,
// 클라이언트가 "계정이 정지됐습니다" 안내를 정확히 표시할 수 있어야 한다.
// HTTP 상태는 403(Forbidden) — 인증 자격은 맞으나 접근 권한이 없음을 표현한다.
public class SuspendedAccountException extends BusinessException {

    public SuspendedAccountException() {
        super(ErrorCode.SUSPENDED_ACCOUNT);
    }
}
