package com.herfree.domain.journal.dto.response;

/**
 * Public home counters retained for compatibility with the existing home client.
 *
 * <p>The calculation belongs to {@code JournalInsightService}; this DTO only describes the API
 * contract.</p>
 */
public record JournalPublicHomeStatsResponse(long usersRecordingToday, long totalUsers) {}
