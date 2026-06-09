package com.herfree.domain.post.exception;

import com.herfree.global.exception.BusinessException;
import com.herfree.global.exception.ErrorCode;

// 본인 게시글이 아닌데 수정·삭제를 시도할 때 403을 반환한다.
// 401(미인증)과 403(인증됐지만 권한 없음)을 구분해야 클라이언트가 정확한 UI를 표시할 수 있다.
public class PostAccessDeniedException extends BusinessException {

    public PostAccessDeniedException() {
        super(ErrorCode.POST_ACCESS_DENIED);
    }
}
