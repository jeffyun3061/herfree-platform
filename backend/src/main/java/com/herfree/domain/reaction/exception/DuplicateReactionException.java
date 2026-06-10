package com.herfree.domain.reaction.exception;

import com.herfree.global.exception.BusinessException;
import com.herfree.global.exception.ErrorCode;

// toggle 방식을 채택했기 때문에 실제로는 이 예외가 던져지지 않는다.
// 향후 toggle이 아닌 단순 등록 방식으로 변경될 경우를 대비해 정의해 둔다.
public class DuplicateReactionException extends BusinessException {

    public DuplicateReactionException() {
        super(ErrorCode.DUPLICATE_REACTION);
    }
}
