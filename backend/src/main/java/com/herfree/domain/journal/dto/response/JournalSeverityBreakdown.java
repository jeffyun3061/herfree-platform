package com.herfree.domain.journal.dto.response;

public record JournalSeverityBreakdown(
        int lowDays,
        int mediumDays,
        int highDays
) {
}
