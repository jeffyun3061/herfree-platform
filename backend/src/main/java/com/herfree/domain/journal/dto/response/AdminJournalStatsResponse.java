package com.herfree.domain.journal.dto.response;

import java.util.List;

public record AdminJournalStatsResponse(
        long totalRecords,
        long totalUsers,
        long symptomRecords,
        long recordsLast7Days,
        long recordsLast30Days,
        long symptomRecordsLast7Days,
        long symptomRecordsLast30Days,
        long pendingReports,
        long acceptedReports,
        long rejectedReports,
        long hiddenPostsCount,
        long hiddenCommentsCount,
        List<String> contentHints,
        List<String> insightLines,
        JournalInsightsResponse communityInsights
) {
}
