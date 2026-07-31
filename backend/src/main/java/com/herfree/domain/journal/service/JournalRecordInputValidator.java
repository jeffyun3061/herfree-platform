package com.herfree.domain.journal.service;

import com.herfree.domain.journal.dto.request.JournalRecordUpsertRequest;
import com.herfree.global.common.AppTimeZone;
import com.herfree.global.exception.BusinessException;
import com.herfree.global.exception.ErrorCode;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.stereotype.Component;

/** Validates write-time journal invariants while keeping historic records readable. */
@Component
public class JournalRecordInputValidator {

    static final int MAX_MEMO_LENGTH = 200;
    static final int MAX_CODE_LIST_SIZE = 10;
    private static final BigDecimal MIN_SLEEP_HOURS = BigDecimal.ZERO;
    private static final BigDecimal MAX_SLEEP_HOURS = BigDecimal.valueOf(24);

    void validate(JournalRecordUpsertRequest request) {
        if (request.recordDate().isAfter(AppTimeZone.todayKst())) {
            invalid("recordDate must not be in the future");
        }
        validateSleepHours(request.sleepHours());
        if (request.memo() != null && request.memo().length() > MAX_MEMO_LENGTH) {
            invalid("memo must be 200 characters or fewer");
        }
        validateCodes(request.prodromalSymptoms(), true);
        validateCodes(request.triggers(), false);

        boolean hadSymptoms = Boolean.TRUE.equals(request.hadSymptoms());
        if (hadSymptoms && request.severity() == null) {
            invalid("severity is required when symptoms are present");
        }
        if (!hadSymptoms
                && (request.severity() != null
                || (request.triggers() != null && !request.triggers().isEmpty()))) {
            invalid("severity and triggers require hadSymptoms=true");
        }
    }

    private void validateSleepHours(BigDecimal sleepHours) {
        if (sleepHours == null) {
            return;
        }
        if (sleepHours.compareTo(MIN_SLEEP_HOURS) < 0
                || sleepHours.compareTo(MAX_SLEEP_HOURS) > 0
                || sleepHours.stripTrailingZeros().scale() > 1) {
            invalid("sleepHours must be between 0 and 24 with at most one decimal place");
        }
    }

    private void validateCodes(List<String> codes, boolean symptoms) {
        if (codes == null) {
            return;
        }
        if (codes.size() > MAX_CODE_LIST_SIZE) {
            invalid("journal code lists may contain at most 10 items");
        }
        boolean hasUnknown = codes.stream()
                .anyMatch(code -> code == null
                        || (symptoms
                        ? !JournalVocabulary.isKnownSymptom(code)
                        : !JournalVocabulary.isKnownTrigger(code)));
        if (hasUnknown) {
            invalid("unknown journal code");
        }
    }

    private void invalid(String message) {
        throw new BusinessException(ErrorCode.INVALID_INPUT, message);
    }
}
