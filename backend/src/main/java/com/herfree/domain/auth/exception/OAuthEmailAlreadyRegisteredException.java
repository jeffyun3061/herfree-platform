package com.herfree.domain.auth.exception;

import com.herfree.global.exception.BusinessException;
import com.herfree.global.exception.ErrorCode;

public class OAuthEmailAlreadyRegisteredException extends BusinessException {

    public OAuthEmailAlreadyRegisteredException() {
        super(ErrorCode.OAUTH_EMAIL_ALREADY_REGISTERED);
    }
}
