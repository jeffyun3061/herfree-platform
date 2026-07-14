package com.herfree.domain.user.exception;

import com.herfree.global.exception.BusinessException;
import com.herfree.global.exception.ErrorCode;

public class SameNicknameException extends BusinessException {

    public SameNicknameException() {
        super(ErrorCode.SAME_NICKNAME);
    }
}
