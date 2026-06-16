package com.herfree.domain.journal.dto.response;

import com.herfree.domain.journal.entity.JournalRecord;
import com.herfree.domain.journal.entity.MedicationStatus;
import com.herfree.domain.journal.entity.MoodType;
import com.herfree.domain.journal.entity.SleepRange;
import com.herfree.domain.journal.entity.StressLevel;
import java.math.BigDecimal;
import java.util.List;

public record JournalRecordResponse(
        Long id,
        String recordDate,
        MedicationStatus medicationStatus,
        SleepRange avgSleep,
        StressLevel stressLevel,
        boolean hadSymptoms,
        List<String> prodromalSymptoms,
        Integer severity,
        List<String> triggers,
        String memo,
        MoodType mood,
        BigDecimal sleepHours,
        boolean supplementTaken,
        boolean exerciseDone,
        String createdAt,
        String updatedAt
) {
    public static JournalRecordResponse from(JournalRecord record) {
        return new JournalRecordResponse(
                record.getId(),
                record.getRecordDate().toString(),
                record.getMedicationStatus(),
                record.getAvgSleep(),
                record.getStressLevel(),
                record.isHadSymptoms(),
                record.getProdromalSymptoms(),
                record.getSeverity(),
                record.getTriggers(),
                record.getMemo(),
                record.getMood(),
                record.getSleepHours(),
                record.isSupplementTaken(),
                record.isExerciseDone(),
                record.getCreatedAt() != null ? record.getCreatedAt().toString() : null,
                record.getUpdatedAt() != null ? record.getUpdatedAt().toString() : null
        );
    }
}
