package com.herfree.domain.report.exception;

import com.herfree.global.exception.BusinessException;
import com.herfree.global.exception.ErrorCode;

public class SelfReportException extends BusinessException {

    public SelfReportException() {
        super(ErrorCode.SELF_REPORT_NOT_ALLOWED);
    }
}
