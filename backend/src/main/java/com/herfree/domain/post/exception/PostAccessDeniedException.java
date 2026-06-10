package com.herfree.domain.post.exception;

import com.herfree.global.exception.BusinessException;
import com.herfree.global.exception.ErrorCode;

// 인증은 됐지만 해당 게시글을 수정/삭제할 권한이 없을 때 던진다
// 403을 반환해 클라이언트가 "내 글이 아닙니다" UI를 표시할 수 있도록 한다
public class PostAccessDeniedException extends BusinessException {

    public PostAccessDeniedException() {
        super(ErrorCode.POST_ACCESS_DENIED);
    }
}
