package com.herfree.domain.journal.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;

import com.herfree.domain.comment.entity.CommentStatus;
import com.herfree.domain.comment.repository.CommentRepository;
import com.herfree.domain.journal.dto.response.JournalInsightItemResponse;
import com.herfree.domain.journal.dto.response.JournalInsightsResponse;
import com.herfree.domain.journal.repository.JournalRecordRepository;
import com.herfree.domain.post.entity.PostStatus;
import com.herfree.domain.post.repository.PostRepository;
import com.herfree.domain.report.entity.ReportStatus;
import com.herfree.domain.report.repository.ReportRepository;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AdminJournalStatisticsFacadeTest {

    @Mock
    private JournalRecordRepository journalRecordRepository;

    @Mock
    private ReportRepository reportRepository;

    @Mock
    private PostRepository postRepository;

    @Mock
    private CommentRepository commentRepository;

    @Mock
    private JournalInsightService journalInsightService;

    @InjectMocks
    private AdminJournalStatisticsFacade adminJournalStatisticsFacade;

    @Test
    void composesOperationalMetricsWithoutPuttingModerationDependenciesInJournalServices() {
        JournalInsightsResponse insights = new JournalInsightsResponse(
                20,
                true,
                List.of(new JournalInsightItemResponse("STRESS", "스트레스", 25)),
                List.of(),
                "message",
                List.of("insight line")
        );
        given(journalInsightService.getCommunityInsights()).willReturn(insights);
        given(journalRecordRepository.countConsentedRecords()).willReturn(80L);
        given(journalRecordRepository.countDistinctConsentedUsers()).willReturn(20L);
        given(journalRecordRepository.countConsentedSymptomRecords()).willReturn(30L);
        given(journalRecordRepository.countConsentedRecordsBetween(any(LocalDate.class), any(LocalDate.class)))
                .willReturn(7L, 28L);
        given(journalRecordRepository.countConsentedSymptomRecordsBetween(any(LocalDate.class), any(LocalDate.class)))
                .willReturn(3L, 12L);
        given(reportRepository.countByStatus(ReportStatus.PENDING)).willReturn(2L);
        given(reportRepository.countByStatus(ReportStatus.ACCEPTED)).willReturn(8L);
        given(reportRepository.countByStatus(ReportStatus.REJECTED)).willReturn(1L);
        given(postRepository.countByStatus(PostStatus.HIDDEN)).willReturn(4L);
        given(commentRepository.countByStatus(CommentStatus.HIDDEN)).willReturn(5L);

        var stats = adminJournalStatisticsFacade.getAdminStats();

        assertThat(stats.totalRecords()).isEqualTo(80);
        assertThat(stats.pendingReports()).isEqualTo(2);
        assertThat(stats.hiddenPostsCount()).isEqualTo(4);
        assertThat(stats.hiddenCommentsCount()).isEqualTo(5);
        assertThat(stats.contentHints()).containsExactly("스트레스 트리거가 많아 스트레스 관리 콘텐츠 필요");
        assertThat(stats.insightLines()).contains("insight line");
    }
}
