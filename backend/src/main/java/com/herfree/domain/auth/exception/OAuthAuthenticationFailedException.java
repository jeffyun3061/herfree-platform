package com.herfree.domain.auth.exception;

import com.herfree.global.exception.BusinessException;
import com.herfree.global.exception.ErrorCode;

public class OAuthAuthenticationFailedException extends BusinessException {

    public OAuthAuthenticationFailedException() {
        super(ErrorCode.OAUTH_AUTHENTICATION_FAILED);
    }
}
