package com.herfree.domain.journal.service;

import com.herfree.domain.comment.repository.CommentRepository;
import com.herfree.domain.journal.dto.response.JournalSeverityTier;
import com.herfree.domain.journal.dto.response.JournalTodayStatusLevel;
import com.herfree.domain.journal.dto.response.JournalTrendDirection;
import com.herfree.domain.journal.exception.JournalRecordNotFoundException;
import com.herfree.domain.journal.entity.JournalRecord;
import com.herfree.domain.journal.entity.MedicationStatus;
import com.herfree.domain.journal.entity.SleepRange;
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
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.willDoNothing;
import static org.mockito.Mockito.verify;

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
        ReflectionTestUtils.setField(user, "id", userId);

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
        ReflectionTestUtils.setField(user, "id", userId);

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

    @Test
    @DisplayName("최근 30일 리뷰 요약은 증상 일수·전조·트리거·심각도를 집계한다")
    void getReviewSummary_aggregates30Days() {
        Long userId = 1L;
        LocalDate today = LocalDate.now();
        User user = User.builder().email("a@b.com").password("pw").build();
        ReflectionTestUtils.setField(user, "id", userId);

        JournalRecord symptomDay = JournalRecord.builder()
                .user(user)
                .recordDate(today.minusDays(2))
                .hadSymptoms(true)
                .severity(4)
                .prodromalSymptoms(List.of("ITCHING", "FATIGUE"))
                .triggers(List.of("SLEEP_DEFICIT", "STRESS"))
                .medicationStatus(MedicationStatus.NORMAL)
                .avgSleep(SleepRange.H5_6)
                .stressLevel(StressLevel.HIGH)
                .supplementTaken(false)
                .exerciseDone(false)
                .build();

        given(journalRecordRepository.findByUserIdAndRecordDateBetweenOrderByRecordDateDesc(
                eq(userId), any(), eq(today)))
                .willReturn(List.of(symptomDay));

        var summary = journalService.getReviewSummary(userId);

        assertThat(summary.periodDays()).isEqualTo(30);
        assertThat(summary.symptomDays()).isEqualTo(1);
        assertThat(summary.topProdromalLabels()).containsExactlyInAnyOrder("가려움", "피로감");
        assertThat(summary.topTriggerLabels()).containsExactlyInAnyOrder("수면 부족", "스트레스");
        assertThat(summary.severityBreakdown().highDays()).isEqualTo(1);
        assertThat(summary.weekDays()).hasSize(7);
        assertThat(summary.timelineDays()).hasSize(30);
        assertThat(summary.timelineDays().stream()
                .filter(day -> day.hadSymptoms())
                .findFirst()
                .orElseThrow()
                .severityTier()).isEqualTo(JournalSeverityTier.HIGH);
        assertThat(summary.medicationRecordedDays()).isEqualTo(1);
    }

    @Test
    @DisplayName("본인 기록은 deleteRecord로 삭제할 수 있다")
    void deleteRecord_owner() {
        Long userId = 1L;
        User user = User.builder().email("a@b.com").password("pw").build();
        ReflectionTestUtils.setField(user, "id", userId);
        JournalRecord record = JournalRecord.builder()
                .user(user)
                .recordDate(LocalDate.now())
                .hadSymptoms(false)
                .supplementTaken(false)
                .exerciseDone(false)
                .build();

        given(journalRecordRepository.findById(10L)).willReturn(Optional.of(record));
        willDoNothing().given(journalRecordRepository).delete(record);

        journalService.deleteRecord(userId, 10L);

        verify(journalRecordRepository).delete(record);
    }

    @Test
    @DisplayName("타인 기록 삭제 시 JournalRecordNotFoundException이 발생한다")
    void deleteRecord_otherUser() {
        Long userId = 1L;
        User otherOwner = User.builder().email("other@b.com").password("pw").build();
        ReflectionTestUtils.setField(otherOwner, "id", 2L);
        JournalRecord record = JournalRecord.builder()
                .user(otherOwner)
                .recordDate(LocalDate.now())
                .hadSymptoms(false)
                .supplementTaken(false)
                .exerciseDone(false)
                .build();

        given(journalRecordRepository.findById(10L)).willReturn(Optional.of(record));

        assertThatThrownBy(() -> journalService.deleteRecord(userId, 10L))
                .isInstanceOf(JournalRecordNotFoundException.class);
    }
}
