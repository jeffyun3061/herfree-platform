package com.herfree.domain.user.exception;

import com.herfree.global.exception.BusinessException;
import com.herfree.global.exception.ErrorCode;

public class NicknameChangeTooSoonException extends BusinessException {

    public NicknameChangeTooSoonException() {
        super(ErrorCode.NICKNAME_CHANGE_TOO_SOON);
    }
}
