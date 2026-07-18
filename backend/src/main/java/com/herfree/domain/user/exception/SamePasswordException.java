package com.herfree.domain.user.exception;

import com.herfree.global.exception.BusinessException;
import com.herfree.global.exception.ErrorCode;

public class SamePasswordException extends BusinessException {

    public SamePasswordException() {
        super(ErrorCode.SAME_PASSWORD);
    }
}
