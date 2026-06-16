package com.herfree.domain.journal.dto.response;

public record JournalReviewWeekDayResponse(
        String date,
        String dayLabel,
        boolean hadSymptoms,
        JournalSeverityTier severityTier
) {
}
