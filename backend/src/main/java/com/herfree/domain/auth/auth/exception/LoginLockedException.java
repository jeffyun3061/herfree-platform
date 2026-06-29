package com.herfree.domain.auth.exception;

import com.herfree.global.exception.BusinessException;
import com.herfree.global.exception.ErrorCode;

public class LoginLockedException extends BusinessException {

    public LoginLockedException() {
        super(ErrorCode.LOGIN_LOCKED);
    }
}
