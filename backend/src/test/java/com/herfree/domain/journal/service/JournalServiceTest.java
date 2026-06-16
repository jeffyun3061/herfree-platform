package com.herfree.domain.journal.service;

import com.herfree.domain.comment.repository.CommentRepository;
import com.herfree.domain.journal.dto.response.JournalTodayStatusLevel;
import com.herfree.domain.journal.dto.response.JournalTrendDirection;
import com.herfree.domain.journal.entity.JournalRecord;
import com.herfree.domain.journal.entity.MedicationStatus;
import com.herfree.domain.journal.entity.StressLevel;
import com.herfree.domain.journal.repository.JournalRecordRepository;
import com.herfree.domain.post.repository.PostRepository;
import com.herfree.domain.report.repository.ReportRepository;
import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.repository.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
class JournalServiceTest {

    @Mock
    private JournalRecordRepository journalRecordRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ReportRepository reportRepository;

    @Mock
    private PostRepository postRepository;

    @Mock
    private CommentRepository commentRepository;

    @InjectMocks
    private JournalService journalService;

    @Test
    @DisplayName("오늘 기록이 없으면 NOT_RECORDED 상태와 안내 문구를 반환한다")
    void getDashboard_notRecorded() {
        Long userId = 1L;
        LocalDate today = LocalDate.now();

        given(journalRecordRepository.findByUserIdAndRecordDate(userId, today)).willReturn(Optional.empty());
        given(journalRecordRepository.findByUserIdAndHadSymptomsTrueOrderByRecordDateDesc(
                eq(userId), any(PageRequest.class)))
                .willReturn(new PageImpl<>(List.of()));
        given(journalRecordRepository.countByUserIdAndHadSymptomsTrue(userId)).willReturn(0L);
        given(journalRecordRepository.countByUserIdAndHadSymptomsTrueAndRecordDateBetween(
                eq(userId), any(), any())).willReturn(0L);
        given(journalRecordRepository.findByUserIdAndRecordDateBetweenOrderByRecordDateDesc(
                eq(userId), any(), eq(today))).willReturn(List.of());
        given(journalRecordRepository.findByUserIdOrderByRecordDateDesc(eq(userId), any(PageRequest.class)))
                .willReturn(new PageImpl<>(List.of()));

        var dashboard = journalService.getDashboard(userId);

        assertThat(dashboard.todayStatusLevel()).isEqualTo(JournalTodayStatusLevel.NOT_RECORDED);
        assertThat(dashboard.todayStatusSummary()).isEqualTo("오늘 기록 전이에요");
        assertThat(dashboard.timelineDays()).hasSize(14);
        assertThat(dashboard.trendDirection()).isEqualTo(JournalTrendDirection.UNKNOWN);
    }

    @Test
    @DisplayName("오늘 증상 없이 안정적이면 STABLE 상태 요약을 반환한다")
    void getDashboard_stableToday() {
        Long userId = 1L;
        LocalDate today = LocalDate.now();
        User user = User.builder().email("a@b.com").password("pw").build();

        JournalRecord record = JournalRecord.builder()
                .user(user)
                .recordDate(today)
                .hadSymptoms(false)
                .stressLevel(StressLevel.LOW)
                .sleepHours(new BigDecimal("6.5"))
                .medicationStatus(MedicationStatus.NORMAL)
                .supplementTaken(false)
                .exerciseDone(false)
                .build();

        given(journalRecordRepository.findByUserIdAndRecordDate(userId, today)).willReturn(Optional.of(record));
        given(journalRecordRepository.findByUserIdAndHadSymptomsTrueOrderByRecordDateDesc(
                eq(userId), any(PageRequest.class)))
                .willReturn(new PageImpl<>(List.of()));
        given(journalRecordRepository.countByUserIdAndHadSymptomsTrue(userId)).willReturn(0L);
        given(journalRecordRepository.countByUserIdAndHadSymptomsTrueAndRecordDateBetween(
                eq(userId), any(), any())).willReturn(0L);
        given(journalRecordRepository.findByUserIdAndRecordDateBetweenOrderByRecordDateDesc(
                eq(userId), any(), eq(today))).willReturn(List.of(record));
        given(journalRecordRepository.findByUserIdOrderByRecordDateDesc(eq(userId), any(PageRequest.class)))
                .willReturn(new PageImpl<>(List.of(record)));

        var dashboard = journalService.getDashboard(userId);

        assertThat(dashboard.todayStatusLevel()).isEqualTo(JournalTodayStatusLevel.STABLE);
        assertThat(dashboard.todayStatusSummary()).contains("증상 없음");
        assertThat(dashboard.todayStatusSummary()).contains("6.5h");
        assertThat(dashboard.todayStatusSummary()).contains("스트레스 낮음");
    }

    @Test
    @DisplayName("오늘 재발 기록이 있으면 RELAPSE 상태를 반환한다")
    void getDashboard_relapseToday() {
        Long userId = 1L;
        LocalDate today = LocalDate.now();
        User user = User.builder().email("a@b.com").password("pw").build();

        JournalRecord record = JournalRecord.builder()
                .user(user)
                .recordDate(today)
                .hadSymptoms(true)
                .severity(4)
                .supplementTaken(false)
                .exerciseDone(false)
                .build();

        given(journalRecordRepository.findByUserIdAndRecordDate(userId, today)).willReturn(Optional.of(record));
        given(journalRecordRepository.findByUserIdAndHadSymptomsTrueOrderByRecordDateDesc(
                eq(userId), any(PageRequest.class)))
                .willReturn(new PageImpl<>(List.of(record)));
        given(journalRecordRepository.countByUserIdAndHadSymptomsTrue(userId)).willReturn(1L);
        given(journalRecordRepository.countByUserIdAndHadSymptomsTrueAndRecordDateBetween(
                eq(userId), any(), any())).willReturn(1L);
        given(journalRecordRepository.findByUserIdAndRecordDateBetweenOrderByRecordDateDesc(
                eq(userId), any(), eq(today))).willReturn(List.of(record));

        var dashboard = journalService.getDashboard(userId);

        assertThat(dashboard.todayStatusLevel()).isEqualTo(JournalTodayStatusLevel.RELAPSE);
        assertThat(dashboard.todayStatusSummary()).contains("재발");
    }
}
