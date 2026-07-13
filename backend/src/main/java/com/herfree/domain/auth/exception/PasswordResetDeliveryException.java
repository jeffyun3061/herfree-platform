package com.herfree.domain.auth.exception;

import com.herfree.global.exception.BusinessException;
import com.herfree.global.exception.ErrorCode;

public class PasswordResetDeliveryException extends BusinessException {

    public PasswordResetDeliveryException() {
        super(ErrorCode.PASSWORD_RESET_DELIVERY_FAILED);
    }
}
