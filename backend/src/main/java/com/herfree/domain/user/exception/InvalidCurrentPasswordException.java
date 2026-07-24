package com.herfree.domain.user.exception;

import com.herfree.global.exception.BusinessException;
import com.herfree.global.exception.ErrorCode;

/** 로그인 자격 증명(401)과 구분 — 세션은 유지하고 현재 비밀번호만 다시 입력하게 한다. */
public class InvalidCurrentPasswordException extends BusinessException {

    public InvalidCurrentPasswordException() {
        super(ErrorCode.INVALID_CURRENT_PASSWORD);
    }
}
