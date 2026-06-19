package com.herfree.domain.journal.dto.response;

import java.util.List;

public record JournalDashboardResponse(
        int relapseFreeDays,
        int totalRelapses,
        int monthRelapses,
        int yearRelapses,
        String lastRelapseDate,
        int routineCompletedToday,
        int routineTotalToday,
        JournalRecordResponse todayRecord,
        List<JournalRecordResponse> recentRelapses,
        String todayStatusSummary,
        JournalTodayStatusLevel todayStatusLevel,
        JournalTrendDirection trendDirection,
        String personalPatternLine,
        List<JournalTimelineDayResponse> timelineDays
) {
}
