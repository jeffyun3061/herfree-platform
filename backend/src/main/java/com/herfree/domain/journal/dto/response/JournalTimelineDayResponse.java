package com.herfree.domain.journal.dto.response;

public record JournalTimelineDayResponse(
        String date,
        boolean recorded,
        boolean hadSymptoms,
        boolean hasProdromal,
        boolean sleepDeficit,
        boolean highStress,
        boolean medicationMissed
) {
}
