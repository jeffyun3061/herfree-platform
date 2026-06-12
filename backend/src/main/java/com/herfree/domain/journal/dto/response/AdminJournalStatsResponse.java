package com.herfree.domain.journal.dto.response;

import java.util.List;

public record AdminJournalStatsResponse(
        long totalRecords,
        long totalUsers,
        long symptomRecords,
        List<String> insightLines,
        JournalInsightsResponse communityInsights
) {
}
