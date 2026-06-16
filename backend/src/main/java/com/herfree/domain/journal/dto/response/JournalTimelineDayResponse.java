package com.herfree.domain.journal.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDate;

public record JournalTimelineDayResponse(
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
        LocalDate date,
        boolean recorded,
        boolean hadSymptoms,
        boolean hasProdromal,
        boolean sleepDeficit,
        boolean highStress,
        boolean medicationMissed
) {
}
