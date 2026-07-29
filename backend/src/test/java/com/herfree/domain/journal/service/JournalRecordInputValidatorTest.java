package com.herfree.domain.journal.service;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.herfree.domain.journal.dto.request.JournalRecordUpsertRequest;
import com.herfree.global.common.AppTimeZone;
import com.herfree.global.exception.BusinessException;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;

class JournalRecordInputValidatorTest {

    private final JournalRecordInputValidator validator = new JournalRecordInputValidator();

    @Test
    void acceptsAConsistentKnownRecord() {
        assertThatCode(() -> validator.validate(request(
                true, 3, List.of("STRESS"), List.of("ITCHING"), BigDecimal.valueOf(7.5), "memo")))
                .doesNotThrowAnyException();
    }

    @Test
    void rejectsFutureDatesUnknownCodesAndInconsistentSymptomFields() {
        assertThatThrownBy(() -> validator.validate(new JournalRecordUpsertRequest(
                AppTimeZone.todayKst().plusDays(1), null, null, null, false,
                List.of("LEGACY_UNKNOWN"), 3, List.of("UNKNOWN_NEW"), null,
                null, BigDecimal.valueOf(25), false, false)))
                .isInstanceOf(BusinessException.class);

        assertThatThrownBy(() -> validator.validate(request(
                false, 3, List.of("STRESS"), List.of("ITCHING"), BigDecimal.valueOf(7), null)))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void rejectsExcessPrecisionAndLongMemo() {
        assertThatThrownBy(() -> validator.validate(request(
                true, 3, List.of("STRESS"), List.of(), new BigDecimal("7.25"), "x".repeat(201))))
                .isInstanceOf(BusinessException.class);
    }

    private JournalRecordUpsertRequest request(
            boolean hadSymptoms,
            Integer severity,
            List<String> triggers,
            List<String> symptoms,
            BigDecimal sleepHours,
            String memo
    ) {
        return new JournalRecordUpsertRequest(
                AppTimeZone.todayKst(), null, null, null, hadSymptoms,
                symptoms, severity, triggers, memo, null, sleepHours, false, false);
    }
}
