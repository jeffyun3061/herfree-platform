package com.herfree.domain.user.service;

import com.herfree.global.exception.BusinessException;
import com.herfree.global.exception.ErrorCode;

public class HealthDataConsentRequiredException extends BusinessException {

    public HealthDataConsentRequiredException() {
        super(ErrorCode.HEALTH_DATA_CONSENT_REQUIRED);
    }
}
