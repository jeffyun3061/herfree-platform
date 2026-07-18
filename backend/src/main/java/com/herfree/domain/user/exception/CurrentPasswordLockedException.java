package com.herfree.domain.user.exception;

import com.herfree.global.exception.BusinessException;
import com.herfree.global.exception.ErrorCode;

public class CurrentPasswordLockedException extends BusinessException {

    public CurrentPasswordLockedException() {
        super(ErrorCode.CURRENT_PASSWORD_LOCKED);
    }
}
