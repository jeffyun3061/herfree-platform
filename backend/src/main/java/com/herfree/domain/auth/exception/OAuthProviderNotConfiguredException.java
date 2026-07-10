package com.herfree.domain.auth.exception;

import com.herfree.global.exception.BusinessException;
import com.herfree.global.exception.ErrorCode;

public class OAuthProviderNotConfiguredException extends BusinessException {

    public OAuthProviderNotConfiguredException() {
        super(ErrorCode.OAUTH_PROVIDER_NOT_CONFIGURED);
    }
}
