package com.herfree.domain.journal.service;

import com.herfree.domain.journal.dto.response.JournalReviewSummaryResponse;
import com.herfree.domain.journal.dto.response.JournalReviewTimelineDayResponse;
import com.herfree.domain.journal.dto.response.JournalReviewWeekDayResponse;
import com.herfree.domain.journal.dto.response.JournalSeverityBreakdown;
import com.herfree.domain.journal.dto.response.JournalSeverityTier;
import com.herfree.domain.journal.entity.JournalRecord;
import com.herfree.domain.journal.entity.MedicationStatus;
import com.herfree.domain.journal.entity.SleepRange;
import com.herfree.domain.journal.entity.StressLevel;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Pure 30-day review projection. It accepts the date explicitly so boundary cases are testable. */
final class JournalReviewCalculator {

    static final int REVIEW_PERIOD_DAYS = 30;

    private static final Map<DayOfWeek, String> WEEKDAY_LABELS = Map.of(
            DayOfWeek.SUNDAY, "일",
            DayOfWeek.MONDAY, "월",
            DayOfWeek.TUESDAY, "화",
            DayOfWeek.WEDNESDAY, "수",
            DayOfWeek.THURSDAY, "목",
            DayOfWeek.FRIDAY, "금",
            DayOfWeek.SATURDAY, "토"
    );

    JournalReviewSummaryResponse calculate(LocalDate today, List<JournalRecord> records) {
        LocalDate periodStart = today.minusDays(REVIEW_PERIOD_DAYS - 1L);
        Map<LocalDate, JournalRecord> recordByDate = records.stream()
                .collect(Collectors.toMap(JournalRecord::getRecordDate, Function.identity(), (a, b) -> a));

        int symptomDays = (int) records.stream().filter(JournalRecord::isHadSymptoms).count();
        List<JournalReviewTimelineDayResponse> timelineDays = new ArrayList<>();
        int lowDays = 0;
        int mediumDays = 0;
        int highDays = 0;

        for (int offset = REVIEW_PERIOD_DAYS - 1; offset >= 0; offset--) {
            LocalDate date = today.minusDays(offset);
            JournalRecord record = recordByDate.get(date);
            if (record != null && record.isHadSymptoms()) {
                JournalSeverityTier tier = resolveSeverityTier(record.getSeverity());
                timelineDays.add(new JournalReviewTimelineDayResponse(date.toString(), true, tier));
                switch (tier) {
                    case LOW -> lowDays++;
                    case MEDIUM -> mediumDays++;
                    case HIGH -> highDays++;
                }
            } else {
                timelineDays.add(new JournalReviewTimelineDayResponse(date.toString(), false, null));
            }
        }
        JournalSeverityBreakdown severityBreakdown = new JournalSeverityBreakdown(lowDays, mediumDays, highDays);

        LocalDate weekStart = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.SUNDAY));
        List<JournalReviewWeekDayResponse> weekDays = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            LocalDate date = weekStart.plusDays(i);
            JournalRecord record = recordByDate.get(date);
            boolean hadSymptoms = record != null && record.isHadSymptoms();
            JournalSeverityTier tier = hadSymptoms ? resolveSeverityTier(record.getSeverity()) : null;
            weekDays.add(new JournalReviewWeekDayResponse(
                    date.toString(),
                    WEEKDAY_LABELS.get(date.getDayOfWeek()),
                    hadSymptoms,
                    tier
            ));
        }

        List<String> topProdromalLabels = topLabelsFromSymptomRecords(records, true);
        List<String> topTriggerLabels = topLabelsFromSymptomRecords(records, false);
        List<String> prodromalOrder = orderedProdromalLabels(records);
        String avgSleepLabel = buildAvgSleepLabel(records);
        String avgStressLabel = buildAvgStressLabel(records);
        int medicationRecordedDays = (int) records.stream()
                .filter(record -> record.getMedicationStatus() != null)
                .count();

        return new JournalReviewSummaryResponse(
                periodStart.toString(),
                today.toString(),
                REVIEW_PERIOD_DAYS,
                symptomDays,
                weekDays,
                topProdromalLabels,
                topTriggerLabels,
                timelineDays,
                severityBreakdown,
                prodromalOrder,
                avgSleepLabel,
                avgStressLabel,
                medicationRecordedDays,
                buildMedicationPattern(records)
        );
    }

    private JournalSeverityTier resolveSeverityTier(Integer severity) {
        if (severity == null) {
            return JournalSeverityTier.MEDIUM;
        }
        if (severity <= 2) {
            return JournalSeverityTier.LOW;
        }
        if (severity == 3) {
            return JournalSeverityTier.MEDIUM;
        }
        return JournalSeverityTier.HIGH;
    }

    private List<String> topLabelsFromSymptomRecords(List<JournalRecord> records, boolean prodromal) {
        Map<String, Integer> counts = new HashMap<>();
        for (JournalRecord record : records) {
            if (!record.isHadSymptoms()) {
                continue;
            }
            List<String> items = prodromal ? record.getProdromalSymptoms() : record.getTriggers();
            if (items == null) {
                continue;
            }
            for (String item : items) {
                if (prodromal && "NONE".equals(item)) {
                    continue;
                }
                counts.merge(item, 1, Integer::sum);
            }
        }
        return counts.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .limit(3)
                .map(entry -> prodromal
                        ? JournalVocabulary.symptomLabel(entry.getKey())
                        : JournalVocabulary.triggerLabel(entry.getKey()))
                .toList();
    }

    private List<String> orderedProdromalLabels(List<JournalRecord> records) {
        Map<String, Integer> counts = new HashMap<>();
        for (JournalRecord record : records) {
            if (!record.isHadSymptoms() || record.getProdromalSymptoms() == null) {
                continue;
            }
            for (String symptom : record.getProdromalSymptoms()) {
                if (!"NONE".equals(symptom)) {
                    counts.merge(symptom, 1, Integer::sum);
                }
            }
        }
        return counts.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .map(entry -> JournalVocabulary.symptomLabel(entry.getKey()))
                .toList();
    }

    private String buildAvgSleepLabel(List<JournalRecord> records) {
        List<Double> hours = new ArrayList<>();
        for (JournalRecord record : records) {
            if (record.getSleepHours() != null) {
                hours.add(record.getSleepHours().doubleValue());
            } else if (record.getAvgSleep() != null) {
                hours.add(sleepRangeMidpoint(record.getAvgSleep()));
            }
        }
        if (hours.isEmpty()) {
            return "기록 없음";
        }
        double avg = hours.stream().mapToDouble(Double::doubleValue).average().orElse(0);
        return String.format("%.1f시간", avg);
    }

    private double sleepRangeMidpoint(SleepRange range) {
        return switch (range) {
            case UNDER_5 -> 4.0;
            case H5_6 -> 5.5;
            case H6_7 -> 6.5;
            case H7_PLUS -> 7.5;
        };
    }

    private String buildAvgStressLabel(List<JournalRecord> records) {
        List<StressLevel> levels = records.stream()
                .map(JournalRecord::getStressLevel)
                .filter(level -> level != null)
                .toList();
        if (levels.isEmpty()) {
            return "기록 없음";
        }
        double avg = levels.stream().mapToInt(this::stressScore).average().orElse(0);
        if (avg < 1.5) {
            return JournalVocabulary.stressLabel(StressLevel.LOW);
        }
        if (avg < 2.5) {
            return JournalVocabulary.stressLabel(StressLevel.MEDIUM);
        }
        return JournalVocabulary.stressLabel(StressLevel.HIGH);
    }

    private int stressScore(StressLevel level) {
        return switch (level) {
            case LOW -> 1;
            case MEDIUM -> 2;
            case HIGH -> 3;
        };
    }

    private String buildMedicationPattern(List<JournalRecord> records) {
        List<JournalRecord> withMedication = records.stream()
                .filter(record -> record.getMedicationStatus() != null)
                .toList();
        if (withMedication.isEmpty()) {
            return "아직 복용 기록이 없어요";
        }

        long weekdayNormal = withMedication.stream()
                .filter(record -> isWeekday(record.getRecordDate()))
                .filter(record -> record.getMedicationStatus() == MedicationStatus.NORMAL)
                .count();
        long weekendNormal = withMedication.stream()
                .filter(record -> !isWeekday(record.getRecordDate()))
                .filter(record -> record.getMedicationStatus() == MedicationStatus.NORMAL)
                .count();
        long irregular = withMedication.stream()
                .filter(record -> record.getMedicationStatus() == MedicationStatus.IRREGULAR)
                .count();

        if (weekdayNormal >= weekendNormal && weekdayNormal > 0) {
            return "주로 평일 복용";
        }
        if (irregular > withMedication.size() / 2) {
            return "불규칙 복용이 잦음";
        }
        if (weekendNormal > weekdayNormal) {
            return "주말 복용 기록이 많음";
        }
        return "꾸준히 복용 기록 중";
    }

    private boolean isWeekday(LocalDate date) {
        DayOfWeek day = date.getDayOfWeek();
        return day != DayOfWeek.SATURDAY && day != DayOfWeek.SUNDAY;
    }
}
