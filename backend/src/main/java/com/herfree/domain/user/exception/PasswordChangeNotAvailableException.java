package com.herfree.domain.user.exception;

import com.herfree.global.exception.BusinessException;
import com.herfree.global.exception.ErrorCode;

public class PasswordChangeNotAvailableException extends BusinessException {

    public PasswordChangeNotAvailableException() {
        super(ErrorCode.PASSWORD_CHANGE_NOT_AVAILABLE);
    }
}
