package com.herfree.domain.journal.service;

import com.herfree.domain.comment.entity.CommentStatus;
import com.herfree.domain.comment.repository.CommentRepository;
import com.herfree.domain.journal.dto.response.AdminJournalStatsResponse;
import com.herfree.domain.journal.dto.response.JournalInsightItemResponse;
import com.herfree.domain.journal.dto.response.JournalInsightsResponse;
import com.herfree.domain.journal.repository.JournalRecordRepository;
import com.herfree.domain.post.entity.PostStatus;
import com.herfree.domain.post.repository.PostRepository;
import com.herfree.domain.report.entity.ReportStatus;
import com.herfree.domain.report.repository.ReportRepository;
import com.herfree.global.common.AppTimeZone;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Composes operational journal metrics with moderation metrics without making personal journal
 * services depend on report, post, or comment repositories.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminJournalStatisticsFacade {

    private final JournalRecordRepository journalRecordRepository;
    private final ReportRepository reportRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final JournalInsightService journalInsightService;

    public AdminJournalStatsResponse getAdminStats() {
        LocalDate today = AppTimeZone.todayKst();
        JournalInsightsResponse communityInsights = journalInsightService.getCommunityInsights();
        long totalRecords = journalRecordRepository.countConsentedRecords();
        long totalUsers = journalRecordRepository.countDistinctConsentedUsers();
        long symptomRecords = journalRecordRepository.countConsentedSymptomRecords();

        long recordsLast7Days = journalRecordRepository.countConsentedRecordsBetween(today.minusDays(6), today);
        long recordsLast30Days = journalRecordRepository.countConsentedRecordsBetween(today.minusDays(29), today);
        long symptomRecordsLast7Days = journalRecordRepository.countConsentedSymptomRecordsBetween(
                today.minusDays(6), today);
        long symptomRecordsLast30Days = journalRecordRepository.countConsentedSymptomRecordsBetween(
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

    private List<String> buildContentHints(JournalInsightsResponse communityInsights) {
        List<String> hints = new ArrayList<>();
        for (JournalInsightItemResponse trigger : communityInsights.topTriggers()) {
            String hint = JournalVocabulary.contentHintForTrigger(trigger.code());
            if (hint != null && trigger.percentage() >= 20) {
                hints.add(hint);
            }
        }
        if (hints.isEmpty() && communityInsights.sufficientData()) {
            hints.add("익명 재발 데이터를 바탕으로 맞춤 콘텐츠 기획을 검토해 보세요.");
        }
        return hints;
    }
}
