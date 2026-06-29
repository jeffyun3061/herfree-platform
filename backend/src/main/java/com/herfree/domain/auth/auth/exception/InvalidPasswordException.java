package com.herfree.domain.auth.exception;

import com.herfree.global.exception.BusinessException;
import com.herfree.global.exception.ErrorCode;

// 비밀번호 불일치 예외
// "계정이 없다"와 "비밀번호가 틀렸다"를 클라이언트에 구분해서 알려주지 않기 위해
// 두 경우 모두 동일한 HTTP 상태(401)와 유사한 메시지를 사용하는 것이 보안에 좋다.
// 하지만 내부적으로는 다른 예외 타입을 사용해 로깅·모니터링 시 구분한다.
public class InvalidPasswordException extends BusinessException {

    public InvalidPasswordException() {
        super(ErrorCode.INVALID_PASSWORD);
    }
}
