package com.herfree.domain.analytics.dto.response;

import java.util.List;

public record AdminStatsResponse(
        long totalUsers,
        long newUsers7d,
        long activePosts,
        long newPosts7d,
        long activeComments,
        long pendingReports,
        long journalRecords,
        long journalRecords7d,
        long contents,
        long videos,
        long eventsToday,
        long events7d,
        List<EventCountResponse> topEvents7d
) {
}
