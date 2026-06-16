package com.herfree.domain.auth.exception;

import com.herfree.global.exception.BusinessException;
import com.herfree.global.exception.ErrorCode;

public class InvalidLoginCredentialsException extends BusinessException {

    public InvalidLoginCredentialsException() {
        super(ErrorCode.INVALID_LOGIN_CREDENTIALS);
    }
}
