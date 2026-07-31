package com.herfree.domain.journal.service;

import com.herfree.domain.journal.dto.response.JournalInsightItemResponse;
import com.herfree.domain.journal.dto.response.JournalInsightsResponse;
import com.herfree.domain.journal.dto.response.JournalPublicHomeStatsResponse;
import com.herfree.domain.journal.entity.JournalRecord;
import com.herfree.domain.journal.repository.JournalRecordRepository;
import com.herfree.domain.user.repository.UserRepository;
import com.herfree.global.common.AppTimeZone;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Consent-filtered, aggregate-only journal insights.
 * Individual journal records never leave this service through the public insight API.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class JournalInsightService {

    private static final int INSIGHT_LOOKBACK_MONTHS = 6;
    private static final int MAX_INSIGHT_RECORDS = 500;

    private final JournalRecordRepository journalRecordRepository;
    private final UserRepository userRepository;
    private final HealthInsightPublicationPolicy publicationPolicy;

    public JournalPublicHomeStatsResponse getPublicHomeStats() {
        long totalUsers = userRepository.count();
        return new JournalPublicHomeStatsResponse(totalUsers);
    }

    public JournalInsightsResponse getCommunityInsights() {
        LocalDate since = AppTimeZone.todayKst().minusMonths(INSIGHT_LOOKBACK_MONTHS);
        List<JournalRecord> records = journalRecordRepository.findRecentConsentedSymptomRecords(
                since, PageRequest.of(0, MAX_INSIGHT_RECORDS + 1));
        if (records.size() > MAX_INSIGHT_RECORDS) {
            return JournalInsightsResponse.unavailable();
        }
        Set<Long> participantIds = records.stream()
                .map(record -> record.getUser().getId())
                .collect(Collectors.toSet());

        if (!publicationPolicy.canPublishCohort(participantIds.size())) {
            return JournalInsightsResponse.insufficient(HealthInsightPublicationPolicy.MIN_PARTICIPANTS);
        }

        Map<String, Set<Long>> triggerUsers = new HashMap<>();
        Map<String, Set<Long>> symptomUsers = new HashMap<>();

        for (JournalRecord record : records) {
            Long participantId = record.getUser().getId();
            if (record.getTriggers() != null) {
                for (String trigger : record.getTriggers()) {
                    if (JournalVocabulary.isKnownTrigger(trigger)) {
                        triggerUsers.computeIfAbsent(trigger, ignored -> new HashSet<>()).add(participantId);
                    }
                }
            }
            if (record.getProdromalSymptoms() != null) {
                for (String symptom : record.getProdromalSymptoms()) {
                    if (!"NONE".equals(symptom) && JournalVocabulary.isKnownSymptom(symptom)) {
                        symptomUsers.computeIfAbsent(symptom, ignored -> new HashSet<>()).add(participantId);
                    }
                }
            }
        }

        List<JournalInsightItemResponse> topTriggers =
                toInsightItems(triggerUsers, JournalVocabulary::triggerLabel, participantIds.size());
        List<JournalInsightItemResponse> topProdromal =
                toInsightItems(symptomUsers, JournalVocabulary::symptomLabel, participantIds.size());

        String message = topTriggers.isEmpty()
                ? "회원들의 익명 기록이 쌓이면 재발 패턴을 함께 살펴볼 수 있어요."
                : String.format(
                        "최근 재발 기록 중 '%s'이(가) 가장 많이 언급됐어요. 나만의 트리거도 꾸준히 기록해 보세요.",
                        topTriggers.get(0).label());

        return new JournalInsightsResponse(
                participantIds.size(),
                true,
                topTriggers,
                topProdromal,
                message,
                buildInsightLines(participantIds.size(), topTriggers, topProdromal)
        );
    }

    private List<JournalInsightItemResponse> toInsightItems(
            Map<String, Set<Long>> participantIdsByCode,
            Function<String, String> labelResolver,
            int sampleSize
    ) {
        return participantIdsByCode.entrySet().stream()
                .filter(entry -> publicationPolicy.canPublishCell(entry.getValue().size()))
                .sorted(Comparator.<Map.Entry<String, Set<Long>>>comparingInt(
                        entry -> entry.getValue().size()).reversed()
                        .thenComparing(Map.Entry::getKey))
                .limit(5)
                .map(entry -> new JournalInsightItemResponse(
                        entry.getKey(),
                        labelResolver.apply(entry.getKey()),
                        publicationPolicy.roundedPercentage(entry.getValue().size(), sampleSize)
                ))
                .toList();
    }

    private List<String> buildInsightLines(
            int sampleSize,
            List<JournalInsightItemResponse> topTriggers,
            List<JournalInsightItemResponse> topProdromal
    ) {
        List<String> lines = new ArrayList<>();
        lines.add(String.format("최근 %d명의 익명 재발 기록을 분석했습니다.", sampleSize));

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
}
