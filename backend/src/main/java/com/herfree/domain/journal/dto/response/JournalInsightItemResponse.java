package com.herfree.domain.journal.dto.response;

public record JournalInsightItemResponse(
        String code,
        String label,
        int percentage
) {
}
