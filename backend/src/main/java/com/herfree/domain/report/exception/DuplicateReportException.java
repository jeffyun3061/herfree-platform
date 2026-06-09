package com.herfree.domain.report.exception;

import com.herfree.global.exception.BusinessException;
import com.herfree.global.exception.ErrorCode;

// 이미 신고한 대상을 다시 신고하려 할 때 409 Conflict를 반환한다.
public class DuplicateReportException extends BusinessException {

    public DuplicateReportException() {
        super(ErrorCode.DUPLICATE_REPORT);
    }
}
