package com.herfree.domain.journal.exception;

import com.herfree.global.exception.BusinessException;
import com.herfree.global.exception.ErrorCode;

public class JournalRecordNotFoundException extends BusinessException {
    public JournalRecordNotFoundException() {
        super(ErrorCode.JOURNAL_RECORD_NOT_FOUND);
    }
}
