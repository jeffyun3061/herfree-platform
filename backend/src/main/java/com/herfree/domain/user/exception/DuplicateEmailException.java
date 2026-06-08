package com.herfree.domain.user.exception;

import com.herfree.global.exception.BusinessException;
import com.herfree.global.exception.ErrorCode;

// 이메일 중복은 클라이언트가 "이미 가입된 계정" UI를 렌더링해야 하므로
// NOT_FOUND나 BAD_REQUEST가 아닌 CONFLICT(409)를 쓰는 ErrorCode를 연결한다.
public class DuplicateEmailException extends BusinessException {

    public DuplicateEmailException() {
        super(ErrorCode.DUPLICATE_EMAIL);
    }
}
