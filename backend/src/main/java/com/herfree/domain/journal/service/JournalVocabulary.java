package com.herfree.domain.journal.service;

import com.herfree.domain.journal.entity.SleepRange;
import com.herfree.domain.journal.entity.StressLevel;
import java.util.Map;

/**
 * Journal codes are persisted as stable values while presentation labels remain centralized here.
 * Unknown historic values intentionally fall back to their stored code instead of being discarded.
 */
final class JournalVocabulary {

    private static final Map<String, String> TRIGGER_LABELS = Map.of(
            "STRESS", "스트레스",
            "SLEEP_DEFICIT", "수면 부족",
            "ALCOHOL", "음주",
            "HIGH_EXERCISE", "고강도 운동",
            "SEXUAL_ACTIVITY", "성관계",
            "MENSTRUATION", "생리 전후",
            "OVERWORK", "과로",
            "LOW_IMMUNITY", "면역 저하",
            "UNKNOWN", "모르겠음"
    );

    private static final Map<String, String> SYMPTOM_LABELS = Map.of(
            "NUMBNESS", "저림",
            "HEAVINESS", "묵직함",
            "WARMTH", "열감",
            "ITCHING", "가려움",
            "PAIN", "통증",
            "FATIGUE", "피로감",
            "NONE", "없었음"
    );

    private static final Map<String, String> CONTENT_HINT_TEMPLATES = Map.of(
            "SLEEP_DEFICIT", "수면 부족 선택이 많아 수면관리 콘텐츠 필요",
            "STRESS", "스트레스 트리거가 많아 스트레스 관리 콘텐츠 필요",
            "ALCOHOL", "음주 관련 트리거가 많아 생활습관 콘텐츠 필요",
            "MENSTRUATION", "생리 전후 트리거가 많아 주기 관리 콘텐츠 필요",
            "OVERWORK", "과로 트리거가 많아 휴식·번아웃 콘텐츠 필요"
    );

    private static final Map<SleepRange, String> SLEEP_RANGE_LABELS = Map.of(
            SleepRange.UNDER_5, "5시간 미만",
            SleepRange.H5_6, "5~6시간",
            SleepRange.H6_7, "6~7시간",
            SleepRange.H7_PLUS, "7시간 이상"
    );

    private static final Map<StressLevel, String> STRESS_LABELS = Map.of(
            StressLevel.LOW, "낮음",
            StressLevel.MEDIUM, "보통",
            StressLevel.HIGH, "높음"
    );

    private JournalVocabulary() {
    }

    static String triggerLabel(String code) {
        return TRIGGER_LABELS.getOrDefault(code, code);
    }

    static boolean isKnownTrigger(String code) {
        return TRIGGER_LABELS.containsKey(code);
    }

    static String symptomLabel(String code) {
        return SYMPTOM_LABELS.getOrDefault(code, code);
    }

    static boolean isKnownSymptom(String code) {
        return SYMPTOM_LABELS.containsKey(code);
    }

    static String contentHintForTrigger(String code) {
        return CONTENT_HINT_TEMPLATES.get(code);
    }

    static String sleepRangeLabel(SleepRange sleepRange) {
        return SLEEP_RANGE_LABELS.getOrDefault(sleepRange, "—");
    }

    static String stressLabel(StressLevel stressLevel) {
        return STRESS_LABELS.getOrDefault(stressLevel, "—");
    }
}
