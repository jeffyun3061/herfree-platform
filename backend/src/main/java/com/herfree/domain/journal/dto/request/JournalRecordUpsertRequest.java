package com.herfree.domain.journal.dto.request;

import com.herfree.domain.journal.entity.MedicationStatus;
import com.herfree.domain.journal.entity.MoodType;
import com.herfree.domain.journal.entity.SleepRange;
import com.herfree.domain.journal.entity.StressLevel;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record JournalRecordUpsertRequest(
        @NotNull LocalDate recordDate,
        MedicationStatus medicationStatus,
        SleepRange avgSleep,
        StressLevel stressLevel,
        @NotNull Boolean hadSymptoms,
        List<String> prodromalSymptoms,
        @Min(1) @Max(5) Integer severity,
        List<String> triggers,
        String memo,
        MoodType mood,
        BigDecimal sleepHours,
        Boolean supplementTaken,
        Boolean exerciseDone
) {
}
