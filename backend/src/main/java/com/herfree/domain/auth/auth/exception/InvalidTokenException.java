package com.herfree.domain.auth.exception;

import com.herfree.global.exception.BusinessException;
import com.herfree.global.exception.ErrorCode;

// JWT 유효성 검증 실패 예외
// 만료·위조·형식 오류 등 다양한 토큰 관련 문제를 하나의 예외로 통합한다.
// 클라이언트에게 토큰 오류 유형을 세분화해 알릴 필요가 없기 때문이다.
// (세분화하면 공격자가 어떤 종류의 오류인지 파악하는 데 도움이 될 수 있다)
public class InvalidTokenException extends BusinessException {

    public InvalidTokenException() {
        super(ErrorCode.INVALID_TOKEN);
    }
}
