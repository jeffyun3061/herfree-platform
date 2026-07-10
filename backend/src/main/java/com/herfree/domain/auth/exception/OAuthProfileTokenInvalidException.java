package com.herfree.domain.auth.exception;

import com.herfree.global.exception.BusinessException;
import com.herfree.global.exception.ErrorCode;

public class OAuthProfileTokenInvalidException extends BusinessException {

    public OAuthProfileTokenInvalidException() {
        super(ErrorCode.OAUTH_PROFILE_TOKEN_INVALID);
    }
}
