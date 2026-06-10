package com.herfree.domain.comment.exception;

import com.herfree.global.exception.BusinessException;
import com.herfree.global.exception.ErrorCode;

// 본인 댓글이 아닌 댓글을 삭제하려 할 때 403을 반환한다
public class CommentAccessDeniedException extends BusinessException {

    public CommentAccessDeniedException() {
        super(ErrorCode.COMMENT_ACCESS_DENIED);
    }
}
