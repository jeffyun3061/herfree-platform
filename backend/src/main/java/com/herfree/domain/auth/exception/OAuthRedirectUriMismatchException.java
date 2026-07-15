package com.herfree.domain.auth.exception;

import com.herfree.global.exception.BusinessException;
import com.herfree.global.exception.ErrorCode;

public class OAuthRedirectUriMismatchException extends BusinessException {

    public OAuthRedirectUriMismatchException() {
        super(ErrorCode.OAUTH_REDIRECT_URI_MISMATCH);
    }
}
