package com.herfree.domain.journal.dto.response;

public record JournalReviewTimelineDayResponse(
        String date,
        boolean hadSymptoms,
        JournalSeverityTier severityTier
) {
}
