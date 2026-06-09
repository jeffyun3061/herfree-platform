package com.herfree.domain.reaction.exception;

import com.herfree.global.exception.BusinessException;
import com.herfree.global.exception.ErrorCode;

// 동일 대상에 동일 반응을 중복 등록하려 할 때 409 Conflict를 반환한다.
// toggleReaction에서는 이 예외 대신 삭제로 처리하므로, 직접 POST 호출 시의 방어용이다.
public class DuplicateReactionException extends BusinessException {

    public DuplicateReactionException() {
        super(ErrorCode.DUPLICATE_REACTION);
    }
}
