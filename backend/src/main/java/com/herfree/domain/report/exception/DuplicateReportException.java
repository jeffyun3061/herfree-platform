package com.herfree.domain.report.exception;

import com.herfree.global.exception.BusinessException;
import com.herfree.global.exception.ErrorCode;

// 동일 사용자가 동일 대상을 이미 신고한 경우 409 Conflict를 반환한다
public class DuplicateReportException extends BusinessException {

    public DuplicateReportException() {
        super(ErrorCode.DUPLICATE_REPORT);
    }
}
