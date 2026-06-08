package com.herfree.domain.user.exception;

import com.herfree.global.exception.BusinessException;
import com.herfree.global.exception.ErrorCode;

// 닉네임 중복도 이메일과 동일하게 Conflict(409) — 클라이언트가 실시간 중복 체크 UI를 쓰기 때문에
// 어떤 필드가 충돌했는지 명확히 구분된 예외 타입이 있어야 핸들러에서 로깅·분기가 쉽다.
public class DuplicateNicknameException extends BusinessException {

    public DuplicateNicknameException() {
        super(ErrorCode.DUPLICATE_NICKNAME);
    }
}
