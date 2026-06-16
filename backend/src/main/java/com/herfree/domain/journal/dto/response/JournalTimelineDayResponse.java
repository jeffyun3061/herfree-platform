package com.herfree.domain.journal.dto.response;

import java.time.LocalDate;

public record JournalTimelineDayResponse(
        LocalDate date,
        boolean recorded,
        boolean hadSymptoms,
        boolean hasProdromal,
        boolean sleepDeficit,
        boolean highStress,
        boolean medicationMissed
) {
}
