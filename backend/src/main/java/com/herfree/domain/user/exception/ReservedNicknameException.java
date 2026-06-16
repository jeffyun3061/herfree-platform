package com.herfree.domain.user.exception;

import com.herfree.global.exception.BusinessException;
import com.herfree.global.exception.ErrorCode;

public class ReservedNicknameException extends BusinessException {

    public ReservedNicknameException() {
        super(ErrorCode.RESERVED_NICKNAME);
    }
}
