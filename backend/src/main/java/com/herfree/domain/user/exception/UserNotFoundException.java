package com.herfree.domain.user.exception;

import com.herfree.global.exception.BusinessException;
import com.herfree.global.exception.ErrorCode;

// RuntimeException을 직접 throw하지 않고 BusinessException 계층을 통해 예외를 던지는 이유:
// GlobalExceptionHandler에서 일관된 방식으로 에러 응답을 내려줄 수 있고,
// 어떤 ErrorCode가 쓰이는지 코드 레벨에서 명확히 보인다.
public class UserNotFoundException extends BusinessException {

    public UserNotFoundException() {
        super(ErrorCode.USER_NOT_FOUND);
    }
}
