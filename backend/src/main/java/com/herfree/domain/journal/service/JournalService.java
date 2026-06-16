package com.herfree.domain.journal.service;

import com.herfree.domain.comment.entity.CommentStatus;
import com.herfree.domain.comment.repository.CommentRepository;
import com.herfree.domain.journal.dto.request.JournalRecordUpsertRequest;
import com.herfree.domain.journal.dto.response.AdminJournalStatsResponse;
import com.herfree.domain.journal.dto.response.JournalDashboardResponse;
import com.herfree.domain.journal.dto.response.JournalInsightItemResponse;
import com.herfree.domain.journal.dto.response.JournalInsightsResponse;
import com.herfree.domain.journal.dto.response.JournalRecordResponse;
import com.herfree.domain.journal.dto.response.JournalReviewSummaryResponse;
import com.herfree.domain.journal.dto.response.JournalReviewTimelineDayResponse;
import com.herfree.domain.journal.dto.response.JournalReviewWeekDayResponse;
import com.herfree.domain.journal.dto.response.JournalSeverityBreakdown;
import com.herfree.domain.journal.dto.response.JournalSeverityTier;
import com.herfree.domain.journal.dto.response.JournalTimelineDayResponse;
import com.herfree.domain.journal.dto.response.JournalTodayStatusLevel;
import com.herfree.domain.journal.dto.response.JournalTrendDirection;
import com.herfree.domain.journal.entity.JournalRecord;
import com.herfree.domain.journal.entity.MedicationStatus;
import com.herfree.domain.journal.entity.SleepRange;
import com.herfree.domain.journal.entity.StressLevel;
import com.herfree.domain.journal.exception.JournalRecordNotFoundException;
import com.herfree.domain.journal.repository.JournalRecordRepository;
import com.herfree.domain.post.entity.PostStatus;
import com.herfree.domain.post.repository.PostRepository;
import com.herfree.domain.report.entity.ReportStatus;
import com.herfree.domain.report.repository.ReportRepository;
import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.exception.UserNotFoundException;
import com.herfree.domain.user.repository.UserRepository;
import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;
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
    private static final int TIMELINE_DAYS = 14;
    private static final int REVIEW_PERIOD_DAYS = 30;

    private static final Map<DayOfWeek, String> WEEKDAY_LABELS = Map.of(
            DayOfWeek.SUNDAY, "일",
            DayOfWeek.MONDAY, "월",
            DayOfWeek.TUESDAY, "화",
            DayOfWeek.WEDNESDAY, "수",
            DayOfWeek.THURSDAY, "목",
            DayOfWeek.FRIDAY, "금",
            DayOfWeek.SATURDAY, "토"
    );

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

    private final JournalRecordRepository journalRecordRepository;
    private final UserRepository userRepository;
    private final ReportRepository reportRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;

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

    @Transactional
    public void deleteRecord(Long userId, Long recordId) {
        JournalRecord record = journalRecordRepository.findById(recordId)
                .orElseThrow(JournalRecordNotFoundException::new);
        if (!record.getUser().getId().equals(userId)) {
            throw new JournalRecordNotFoundException();
        }
        journalRecordRepository.delete(record);
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

    public JournalReviewSummaryResponse getReviewSummary(Long userId) {
        LocalDate today = LocalDate.now();
        LocalDate periodStart = today.minusDays(REVIEW_PERIOD_DAYS - 1L);
        List<JournalRecord> records = journalRecordRepository
                .findByUserIdAndRecordDateBetweenOrderByRecordDateDesc(userId, periodStart, today);
        Map<LocalDate, JournalRecord> recordByDate = records.stream()
                .collect(Collectors.toMap(JournalRecord::getRecordDate, Function.identity(), (a, b) -> a));

        int symptomDays = (int) records.stream().filter(JournalRecord::isHadSymptoms).count();

        List<JournalReviewTimelineDayResponse> timelineDays = new ArrayList<>();
        JournalSeverityBreakdown severityBreakdown = new JournalSeverityBreakdown(0, 0, 0);
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
        severityBreakdown = new JournalSeverityBreakdown(lowDays, mediumDays, highDays);

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
        String medicationPattern = buildMedicationPattern(records);

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
                medicationPattern
        );
    }

    public JournalDashboardResponse getDashboard(Long userId) {
        LocalDate today = LocalDate.now();
        YearMonth month = YearMonth.from(today);

        Optional<JournalRecord> todayEntity = journalRecordRepository.findByUserIdAndRecordDate(userId, today);
        Optional<JournalRecordResponse> todayRecord = todayEntity.map(JournalRecordResponse::from);

        int routineCompleted = todayRecord.map(this::countRoutineTasks).orElse(0);

        List<JournalRecordResponse> recentRelapses = journalRecordRepository
                .findByUserIdAndHadSymptomsTrueOrderByRecordDateDesc(userId, PageRequest.of(0, 5))
                .getContent()
                .stream()
                .map(JournalRecordResponse::from)
                .toList();

        LocalDate lastRelapseDate = recentRelapses.stream()
                .map(response -> LocalDate.parse(response.recordDate()))
                .max(Comparator.naturalOrder())
                .orElse(null);

        int relapseFreeDays = lastRelapseDate == null
                ? (int) daysSinceFirstRecordOrZero(userId, today)
                : (int) java.time.temporal.ChronoUnit.DAYS.between(lastRelapseDate, today);

        int totalRelapses = (int) journalRecordRepository.countByUserIdAndHadSymptomsTrue(userId);
        int monthRelapses = (int) journalRecordRepository.countByUserIdAndHadSymptomsTrueAndRecordDateBetween(
                userId, month.atDay(1), month.atEndOfMonth());

        LocalDate timelineStart = today.minusDays(TIMELINE_DAYS - 1L);
        List<JournalRecord> timelineRecords = journalRecordRepository
                .findByUserIdAndRecordDateBetweenOrderByRecordDateDesc(userId, timelineStart, today);
        Map<LocalDate, JournalRecord> recordByDate = timelineRecords.stream()
                .collect(Collectors.toMap(JournalRecord::getRecordDate, Function.identity(), (a, b) -> a));

        List<JournalTimelineDayResponse> timelineDays = buildTimelineDays(today, recordByDate);
        String todayStatusSummary = buildTodayStatusSummary(todayEntity);
        JournalTodayStatusLevel todayStatusLevel = resolveTodayStatusLevel(todayEntity);
        JournalTrendDirection trendDirection = resolveTrendDirection(timelineRecords, today);
        String personalPatternLine = buildPersonalPatternLine(recentRelapses);

        return new JournalDashboardResponse(
                Math.max(relapseFreeDays, 0),
                totalRelapses,
                monthRelapses,
                routineCompleted,
                ROUTINE_TASK_COUNT,
                todayRecord.orElse(null),
                recentRelapses,
                todayStatusSummary,
                todayStatusLevel,
                trendDirection,
                personalPatternLine,
                timelineDays
        );
    }

    public JournalInsightsResponse getCommunityInsights() {
        LocalDate since = LocalDate.now().minusMonths(INSIGHT_LOOKBACK_MONTHS);
        List<JournalRecord> records = journalRecordRepository.findRecentSymptomRecords(
                since, PageRequest.of(0, 500));

        if (records.size() < INSIGHT_MIN_SAMPLE) {
            return JournalInsightsResponse.insufficient(records.size(), INSIGHT_MIN_SAMPLE);
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
        LocalDate today = LocalDate.now();
        JournalInsightsResponse communityInsights = getCommunityInsights();
        long totalRecords = journalRecordRepository.count();
        long totalUsers = journalRecordRepository.countDistinctUsers();
        long symptomRecords = journalRecordRepository.countByHadSymptomsTrue();

        long recordsLast7Days = journalRecordRepository.countByRecordDateBetween(today.minusDays(6), today);
        long recordsLast30Days = journalRecordRepository.countByRecordDateBetween(today.minusDays(29), today);
        long symptomRecordsLast7Days = journalRecordRepository.countByHadSymptomsTrueAndRecordDateBetween(
                today.minusDays(6), today);
        long symptomRecordsLast30Days = journalRecordRepository.countByHadSymptomsTrueAndRecordDateBetween(
                today.minusDays(29), today);

        long pendingReports = reportRepository.countByStatus(ReportStatus.PENDING);
        long acceptedReports = reportRepository.countByStatus(ReportStatus.ACCEPTED);
        long rejectedReports = reportRepository.countByStatus(ReportStatus.REJECTED);
        long hiddenPostsCount = postRepository.countByStatus(PostStatus.HIDDEN);
        long hiddenCommentsCount = commentRepository.countByStatus(CommentStatus.HIDDEN);

        List<String> contentHints = buildContentHints(communityInsights);
        List<String> adminLines = new ArrayList<>();
        adminLines.add(String.format("누적 일지 기록 %d건 · 참여 회원 %d명", totalRecords, totalUsers));
        adminLines.add(String.format("재발(증상) 기록 %d건 (익명 집계 대상)", symptomRecords));
        adminLines.add(String.format("최근 7일 기록 %d건 · 재발 %d건", recordsLast7Days, symptomRecordsLast7Days));
        adminLines.add(String.format("대기 신고 %d건 · 숨김 글 %d · 숨김 댓글 %d",
                pendingReports, hiddenPostsCount, hiddenCommentsCount));
        adminLines.addAll(communityInsights.insightLines());

        return new AdminJournalStatsResponse(
                totalRecords,
                totalUsers,
                symptomRecords,
                recordsLast7Days,
                recordsLast30Days,
                symptomRecordsLast7Days,
                symptomRecordsLast30Days,
                pendingReports,
                acceptedReports,
                rejectedReports,
                hiddenPostsCount,
                hiddenCommentsCount,
                contentHints,
                adminLines,
                communityInsights
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
            summary.append(", 수면 ").append(SLEEP_RANGE_LABELS.getOrDefault(record.getAvgSleep(), "—"));
        }
        if (record.getStressLevel() != null) {
            summary.append(", 스트레스 ").append(STRESS_LABELS.getOrDefault(record.getStressLevel(), "—"));
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
        String label = TRIGGER_LABELS.getOrDefault(topTrigger, topTrigger);
        return String.format("재발 시 '%s'이(가) 자주 함께 기록돼요.", label);
    }

    private List<String> buildContentHints(JournalInsightsResponse communityInsights) {
        List<String> hints = new ArrayList<>();
        for (JournalInsightItemResponse trigger : communityInsights.topTriggers()) {
            String hint = CONTENT_HINT_TEMPLATES.get(trigger.code());
            if (hint != null && trigger.percentage() >= 20) {
                hints.add(hint);
            }
        }
        if (hints.isEmpty() && communityInsights.sufficientData()) {
            hints.add("익명 재발 데이터를 바탕으로 맞춤 콘텐츠 기획을 검토해 보세요.");
        }
        return hints;
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
        Map<String, String> labels = prodromal ? SYMPTOM_LABELS : TRIGGER_LABELS;
        return counts.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .limit(3)
                .map(entry -> labels.getOrDefault(entry.getKey(), entry.getKey()))
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
                .map(entry -> SYMPTOM_LABELS.getOrDefault(entry.getKey(), entry.getKey()))
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
            return STRESS_LABELS.get(StressLevel.LOW);
        }
        if (avg < 2.5) {
            return STRESS_LABELS.get(StressLevel.MEDIUM);
        }
        return STRESS_LABELS.get(StressLevel.HIGH);
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
