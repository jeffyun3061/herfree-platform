package com.herfree.domain.journal.service;

import com.herfree.domain.journal.dto.request.JournalRecordUpsertRequest;
import com.herfree.domain.journal.dto.response.AdminJournalStatsResponse;
import com.herfree.domain.journal.dto.response.JournalDashboardResponse;
import com.herfree.domain.journal.dto.response.JournalInsightItemResponse;
import com.herfree.domain.journal.dto.response.JournalInsightsResponse;
import com.herfree.domain.journal.dto.response.JournalRecordResponse;
import com.herfree.domain.journal.entity.JournalRecord;
import com.herfree.domain.journal.exception.JournalRecordNotFoundException;
import com.herfree.domain.journal.repository.JournalRecordRepository;
import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.exception.UserNotFoundException;
import com.herfree.domain.user.repository.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class JournalService {

    private static final int INSIGHT_MIN_SAMPLE = 10;
    private static final int INSIGHT_LOOKBACK_MONTHS = 6;
    private static final int ROUTINE_TASK_COUNT = 4;

    private static final Map<String, String> TRIGGER_LABELS = Map.of(
            "STRESS", "스트레스",
            "SLEEP_DEFICIT", "수면 부족",
            "ALCOHOL", "음주",
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
            "FATIGUE", "피로감",
            "NONE", "없었음"
    );

    private final JournalRecordRepository journalRecordRepository;
    private final UserRepository userRepository;

    @Transactional
    public JournalRecordResponse upsertRecord(Long userId, JournalRecordUpsertRequest request) {
        User user = userRepository.findById(userId).orElseThrow(UserNotFoundException::new);

        boolean supplementTaken = Boolean.TRUE.equals(request.supplementTaken());
        boolean exerciseDone = Boolean.TRUE.equals(request.exerciseDone());
        boolean hadSymptoms = Boolean.TRUE.equals(request.hadSymptoms());

        JournalRecord record = journalRecordRepository
                .findByUserIdAndRecordDate(userId, request.recordDate())
                .orElseGet(() -> JournalRecord.builder()
                        .user(user)
                        .recordDate(request.recordDate())
                        .hadSymptoms(false)
                        .supplementTaken(false)
                        .exerciseDone(false)
                        .build());

        record.update(
                request.medicationStatus(),
                request.avgSleep(),
                request.stressLevel(),
                hadSymptoms,
                request.prodromalSymptoms(),
                request.severity(),
                request.triggers(),
                request.memo(),
                request.mood(),
                request.sleepHours(),
                supplementTaken,
                exerciseDone
        );

        return JournalRecordResponse.from(journalRecordRepository.save(record));
    }

    public JournalRecordResponse getRecord(Long userId, Long recordId) {
        JournalRecord record = journalRecordRepository.findById(recordId)
                .orElseThrow(JournalRecordNotFoundException::new);
        if (!record.getUser().getId().equals(userId)) {
            throw new JournalRecordNotFoundException();
        }
        return JournalRecordResponse.from(record);
    }

    public Optional<JournalRecordResponse> getRecordByDate(Long userId, LocalDate date) {
        return journalRecordRepository.findByUserIdAndRecordDate(userId, date)
                .map(JournalRecordResponse::from);
    }

    public Page<JournalRecordResponse> getMyRecords(Long userId, Boolean hadSymptoms, Pageable pageable) {
        Page<JournalRecord> page = Boolean.TRUE.equals(hadSymptoms)
                ? journalRecordRepository.findByUserIdAndHadSymptomsTrueOrderByRecordDateDesc(userId, pageable)
                : journalRecordRepository.findByUserIdOrderByRecordDateDesc(userId, pageable);
        return page.map(JournalRecordResponse::from);
    }

    public JournalDashboardResponse getDashboard(Long userId) {
        LocalDate today = LocalDate.now();
        YearMonth month = YearMonth.from(today);

        Optional<JournalRecordResponse> todayRecord = journalRecordRepository
                .findByUserIdAndRecordDate(userId, today)
                .map(JournalRecordResponse::from);

        int routineCompleted = todayRecord.map(this::countRoutineTasks).orElse(0);

        List<JournalRecordResponse> recentRelapses = journalRecordRepository
                .findByUserIdAndHadSymptomsTrueOrderByRecordDateDesc(userId, PageRequest.of(0, 5))
                .getContent()
                .stream()
                .map(JournalRecordResponse::from)
                .toList();

        LocalDate lastRelapseDate = recentRelapses.stream()
                .map(JournalRecordResponse::recordDate)
                .max(Comparator.naturalOrder())
                .orElse(null);

        int relapseFreeDays = lastRelapseDate == null
                ? (int) daysSinceFirstRecordOrZero(userId, today)
                : (int) java.time.temporal.ChronoUnit.DAYS.between(lastRelapseDate, today);

        int totalRelapses = (int) journalRecordRepository.countByUserIdAndHadSymptomsTrue(userId);
        int monthRelapses = (int) journalRecordRepository.countByUserIdAndHadSymptomsTrueAndRecordDateBetween(
                userId, month.atDay(1), month.atEndOfMonth());

        return new JournalDashboardResponse(
                Math.max(relapseFreeDays, 0),
                totalRelapses,
                monthRelapses,
                routineCompleted,
                ROUTINE_TASK_COUNT,
                todayRecord.orElse(null),
                recentRelapses
        );
    }

    public JournalInsightsResponse getCommunityInsights() {
        LocalDate since = LocalDate.now().minusMonths(INSIGHT_LOOKBACK_MONTHS);
        List<JournalRecord> records = journalRecordRepository.findRecentSymptomRecords(
                since, PageRequest.of(0, 500));

        if (records.size() < INSIGHT_MIN_SAMPLE) {
            return JournalInsightsResponse.empty();
        }

        Map<String, Integer> triggerCounts = new HashMap<>();
        Map<String, Integer> symptomCounts = new HashMap<>();

        for (JournalRecord record : records) {
            if (record.getTriggers() != null) {
                for (String trigger : record.getTriggers()) {
                    triggerCounts.merge(trigger, 1, Integer::sum);
                }
            }
            if (record.getProdromalSymptoms() != null) {
                for (String symptom : record.getProdromalSymptoms()) {
                    if (!"NONE".equals(symptom)) {
                        symptomCounts.merge(symptom, 1, Integer::sum);
                    }
                }
            }
        }

        List<JournalInsightItemResponse> topTriggers = toInsightItems(triggerCounts, TRIGGER_LABELS, records.size());
        List<JournalInsightItemResponse> topProdromal = toInsightItems(symptomCounts, SYMPTOM_LABELS, records.size());

        String message = topTriggers.isEmpty()
                ? "회원들의 익명 기록이 쌓이면 재발 패턴을 함께 살펴볼 수 있어요."
                : String.format(
                        "최근 재발 기록 중 '%s'이(가) 가장 많이 언급됐어요. 나만의 트리거도 꾸준히 기록해 보세요.",
                        topTriggers.get(0).label());

        List<String> insightLines = buildInsightLines(records.size(), topTriggers, topProdromal);

        return new JournalInsightsResponse(
                records.size(),
                true,
                topTriggers,
                topProdromal,
                message,
                insightLines
        );
    }

    public AdminJournalStatsResponse getAdminStats() {
        JournalInsightsResponse communityInsights = getCommunityInsights();
        long totalRecords = journalRecordRepository.count();
        long totalUsers = journalRecordRepository.countDistinctUsers();
        long symptomRecords = journalRecordRepository.countByHadSymptomsTrue();

        List<String> adminLines = new ArrayList<>();
        adminLines.add(String.format("누적 일지 기록 %d건 · 참여 회원 %d명", totalRecords, totalUsers));
        adminLines.add(String.format("재발(증상) 기록 %d건 (익명 집계 대상)", symptomRecords));
        adminLines.addAll(communityInsights.insightLines());

        return new AdminJournalStatsResponse(
                totalRecords,
                totalUsers,
                symptomRecords,
                adminLines,
                communityInsights
        );
    }

    private List<String> buildInsightLines(
            int sampleSize,
            List<JournalInsightItemResponse> topTriggers,
            List<JournalInsightItemResponse> topProdromal
    ) {
        List<String> lines = new ArrayList<>();
        lines.add(String.format("최근 %d건의 익명 재발 기록을 분석했습니다.", sampleSize));

        for (JournalInsightItemResponse item : topTriggers) {
            lines.add(String.format("추정 트리거 · %s %d%%", item.label(), item.percentage()));
        }
        for (JournalInsightItemResponse item : topProdromal) {
            lines.add(String.format("전조 증상 · %s %d%%", item.label(), item.percentage()));
        }

        if (lines.size() == 1) {
            lines.add("패턴 데이터가 더 쌓이면 한 줄 요약이 늘어납니다.");
        }
        return lines;
    }

    private long daysSinceFirstRecordOrZero(Long userId, LocalDate today) {
        return journalRecordRepository.findByUserIdOrderByRecordDateDesc(userId, PageRequest.of(0, 1))
                .stream()
                .findFirst()
                .map(r -> java.time.temporal.ChronoUnit.DAYS.between(r.getRecordDate(), today))
                .orElse(0L);
    }

    private int countRoutineTasks(JournalRecordResponse record) {
        int count = 0;
        if (record.sleepHours() != null || record.avgSleep() != null) count++;
        if (record.supplementTaken()) count++;
        if (record.exerciseDone()) count++;
        if (record.mood() != null) count++;
        return count;
    }

    private List<JournalInsightItemResponse> toInsightItems(
            Map<String, Integer> counts,
            Map<String, String> labels,
            int sampleSize
    ) {
        return counts.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .limit(5)
                .map(entry -> new JournalInsightItemResponse(
                        entry.getKey(),
                        labels.getOrDefault(entry.getKey(), entry.getKey()),
                        Math.round(entry.getValue() * 100f / sampleSize)
                ))
                .toList();
    }
}
