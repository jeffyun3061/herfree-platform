package com.herfree.domain.journal.service;

import com.herfree.domain.journal.dto.response.JournalDashboardResponse;
import com.herfree.domain.journal.dto.response.JournalRecordResponse;
import com.herfree.domain.journal.dto.response.JournalTimelineDayResponse;
import com.herfree.domain.journal.dto.response.JournalTodayStatusLevel;
import com.herfree.domain.journal.dto.response.JournalTrendDirection;
import com.herfree.domain.journal.entity.JournalRecord;
import com.herfree.domain.journal.entity.MedicationStatus;
import com.herfree.domain.journal.entity.SleepRange;
import com.herfree.domain.journal.entity.StressLevel;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Pure dashboard calculation; persistence and the current date stay in the application service. */
final class JournalDashboardCalculator {

    static final int TIMELINE_DAYS = 14;
    static final int ROUTINE_TASK_COUNT = 3;

    JournalDashboardResponse calculate(
            LocalDate today,
            Optional<JournalRecord> todayEntity,
            List<JournalRecord> recentRelapseEntities,
            long daysSinceFirstRecordOrZero,
            int totalRelapses,
            int monthRelapses,
            int yearRelapses,
            List<JournalRecord> timelineRecords
    ) {
        Optional<JournalRecordResponse> todayRecord = todayEntity.map(JournalRecordResponse::from);
        int routineCompleted = todayRecord.map(this::countRoutineTasks).orElse(0);

        List<JournalRecordResponse> recentRelapses = recentRelapseEntities.stream()
                .map(JournalRecordResponse::from)
                .toList();
        LocalDate lastRelapseLocalDate = recentRelapses.stream()
                .map(response -> LocalDate.parse(response.recordDate()))
                .max(Comparator.naturalOrder())
                .orElse(null);

        int relapseFreeDays = lastRelapseLocalDate == null
                ? (int) daysSinceFirstRecordOrZero
                : (int) ChronoUnit.DAYS.between(lastRelapseLocalDate, today);
        String lastRelapseDate = lastRelapseLocalDate != null ? lastRelapseLocalDate.toString() : null;

        Map<LocalDate, JournalRecord> recordByDate = timelineRecords.stream()
                .collect(Collectors.toMap(JournalRecord::getRecordDate, Function.identity(), (a, b) -> a));

        return new JournalDashboardResponse(
                Math.max(relapseFreeDays, 0),
                totalRelapses,
                monthRelapses,
                yearRelapses,
                lastRelapseDate,
                routineCompleted,
                ROUTINE_TASK_COUNT,
                todayRecord.orElse(null),
                recentRelapses,
                buildTodayStatusSummary(todayEntity),
                resolveTodayStatusLevel(todayEntity),
                resolveTrendDirection(timelineRecords, today),
                buildPersonalPatternLine(recentRelapses),
                buildTimelineDays(today, recordByDate)
        );
    }

    private List<JournalTimelineDayResponse> buildTimelineDays(
            LocalDate today,
            Map<LocalDate, JournalRecord> recordByDate
    ) {
        List<JournalTimelineDayResponse> days = new ArrayList<>();
        for (int offset = TIMELINE_DAYS - 1; offset >= 0; offset--) {
            LocalDate date = today.minusDays(offset);
            JournalRecord record = recordByDate.get(date);
            if (record == null) {
                days.add(new JournalTimelineDayResponse(date.toString(), false, false, false, false, false, false));
            } else {
                days.add(new JournalTimelineDayResponse(
                        date.toString(),
                        true,
                        record.isHadSymptoms(),
                        hasProdromal(record),
                        isSleepDeficit(record),
                        isHighStress(record),
                        isMedicationMissed(record)
                ));
            }
        }
        return days;
    }

    private String buildTodayStatusSummary(Optional<JournalRecord> todayEntity) {
        if (todayEntity.isEmpty()) {
            return "오늘 기록 전이에요";
        }
        JournalRecord record = todayEntity.get();
        if (record.isHadSymptoms()) {
            Integer severity = record.getSeverity();
            return severity != null
                    ? String.format("오늘 재발 기록 · 심각도 %d", severity)
                    : "오늘 재발 기록";
        }

        StringBuilder summary = new StringBuilder("오늘은 증상 없음");
        if (record.getSleepHours() != null) {
            summary.append(String.format(", 수면 %sh", record.getSleepHours().stripTrailingZeros().toPlainString()));
        } else if (record.getAvgSleep() != null) {
            summary.append(", 수면 ").append(JournalVocabulary.sleepRangeLabel(record.getAvgSleep()));
        }
        if (record.getStressLevel() != null) {
            summary.append(", 스트레스 ").append(JournalVocabulary.stressLabel(record.getStressLevel()));
        }
        return summary.toString();
    }

    private JournalTodayStatusLevel resolveTodayStatusLevel(Optional<JournalRecord> todayEntity) {
        if (todayEntity.isEmpty()) {
            return JournalTodayStatusLevel.NOT_RECORDED;
        }
        JournalRecord record = todayEntity.get();
        if (record.isHadSymptoms()) {
            return JournalTodayStatusLevel.RELAPSE;
        }
        if (hasProdromal(record) || isSleepDeficit(record) || isHighStress(record) || isMedicationMissed(record)) {
            return JournalTodayStatusLevel.ATTENTION;
        }
        return JournalTodayStatusLevel.STABLE;
    }

    private JournalTrendDirection resolveTrendDirection(List<JournalRecord> recentRecords, LocalDate today) {
        if (recentRecords.size() < 3) {
            return JournalTrendDirection.UNKNOWN;
        }

        LocalDate recentStart = today.minusDays(6);
        LocalDate previousStart = today.minusDays(13);
        LocalDate previousEnd = today.minusDays(7);

        int recentScore = scorePeriod(recentRecords, recentStart, today);
        int previousScore = scorePeriod(recentRecords, previousStart, previousEnd);

        if (previousScore == 0 && recentScore == 0) {
            return JournalTrendDirection.STABLE;
        }
        if (recentScore < previousScore) {
            return JournalTrendDirection.IMPROVING;
        }
        if (recentScore > previousScore) {
            return JournalTrendDirection.WORSENING;
        }
        return JournalTrendDirection.STABLE;
    }

    private int scorePeriod(List<JournalRecord> records, LocalDate from, LocalDate to) {
        return records.stream()
                .filter(record -> !record.getRecordDate().isBefore(from) && !record.getRecordDate().isAfter(to))
                .mapToInt(this::dayConcernScore)
                .sum();
    }

    private int dayConcernScore(JournalRecord record) {
        int score = 0;
        if (record.isHadSymptoms()) {
            score += 3;
        }
        if (hasProdromal(record)) {
            score += 2;
        }
        if (isSleepDeficit(record)) {
            score += 1;
        }
        if (isHighStress(record)) {
            score += 1;
        }
        if (isMedicationMissed(record)) {
            score += 1;
        }
        return score;
    }

    private String buildPersonalPatternLine(List<JournalRecordResponse> recentRelapses) {
        if (recentRelapses.isEmpty()) {
            return "재발 기록이 쌓이면 나만의 패턴 한 줄을 보여 드릴게요.";
        }

        Map<String, Integer> triggerCounts = new HashMap<>();
        for (JournalRecordResponse relapse : recentRelapses) {
            if (relapse.triggers() != null) {
                for (String trigger : relapse.triggers()) {
                    triggerCounts.merge(trigger, 1, Integer::sum);
                }
            }
        }

        if (triggerCounts.isEmpty()) {
            return String.format("최근 %d회 재발 기록이 있어요. 트리거를 남기면 패턴이 더 선명해져요.", recentRelapses.size());
        }

        String topTrigger = triggerCounts.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("UNKNOWN");
        return String.format("재발 시 '%s'이(가) 자주 함께 기록돼요.", JournalVocabulary.triggerLabel(topTrigger));
    }

    private boolean hasProdromal(JournalRecord record) {
        List<String> symptoms = record.getProdromalSymptoms();
        if (symptoms == null || symptoms.isEmpty()) {
            return false;
        }
        return symptoms.stream().anyMatch(symptom -> !"NONE".equals(symptom));
    }

    private boolean isSleepDeficit(JournalRecord record) {
        if (record.getSleepHours() != null
                && record.getSleepHours().compareTo(BigDecimal.valueOf(6)) < 0) {
            return true;
        }
        SleepRange sleep = record.getAvgSleep();
        return sleep == SleepRange.UNDER_5 || sleep == SleepRange.H5_6;
    }

    private boolean isHighStress(JournalRecord record) {
        return record.getStressLevel() == StressLevel.HIGH;
    }

    private boolean isMedicationMissed(JournalRecord record) {
        MedicationStatus status = record.getMedicationStatus();
        return status == MedicationStatus.IRREGULAR || status == MedicationStatus.NOT_TAKING;
    }

    private int countRoutineTasks(JournalRecordResponse record) {
        int count = 0;
        if (isSleepRoutineComplete(record)) {
            count++;
        }
        if (record.supplementTaken()) {
            count++;
        }
        if (isConditionRecorded(record)) {
            count++;
        }
        return count;
    }

    private boolean isSleepRoutineComplete(JournalRecordResponse record) {
        if (record.avgSleep() == SleepRange.H7_PLUS) {
            return true;
        }
        return record.sleepHours() != null
                && record.sleepHours().compareTo(BigDecimal.valueOf(7)) >= 0;
    }

    private boolean isConditionRecorded(JournalRecordResponse record) {
        if (record.stressLevel() != null || record.mood() != null) {
            return true;
        }
        String memo = record.memo();
        return memo != null && !memo.isBlank();
    }
}
