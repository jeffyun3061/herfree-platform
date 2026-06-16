package com.herfree.domain.journal.dto.response;

import java.util.List;

public record JournalReviewSummaryResponse(
        String periodStart,
        String periodEnd,
        int periodDays,
        int symptomDays,
        List<JournalReviewWeekDayResponse> weekDays,
        List<String> topProdromalLabels,
        List<String> topTriggerLabels,
        List<JournalReviewTimelineDayResponse> timelineDays,
        JournalSeverityBreakdown severityBreakdown,
        List<String> prodromalOrder,
        String avgSleepLabel,
        String avgStressLabel,
        int medicationRecordedDays,
        String medicationPattern
) {
}
