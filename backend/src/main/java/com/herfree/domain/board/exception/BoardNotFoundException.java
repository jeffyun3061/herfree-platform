package com.herfree.domain.board.exception;

import com.herfree.global.exception.BusinessException;
import com.herfree.global.exception.ErrorCode;

// RuntimeException을 직접 던지지 않고 BusinessException 계층을 통하는 이유:
// GlobalExceptionHandler가 ErrorCode를 기반으로 일관된 HTTP 응답을 생성할 수 있다
public class BoardNotFoundException extends BusinessException {

    public BoardNotFoundException() {
        super(ErrorCode.BOARD_NOT_FOUND);
    }
}
