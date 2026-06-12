package com.herfree.domain.journal.dto.response;

import java.time.LocalDate;
import java.util.List;

public record JournalDashboardResponse(
        int relapseFreeDays,
        int totalRelapses,
        int monthRelapses,
        int routineCompletedToday,
        int routineTotalToday,
        JournalRecordResponse todayRecord,
        List<JournalRecordResponse> recentRelapses
) {
}
