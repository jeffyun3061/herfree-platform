package com.herfree.domain.journal.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;

import com.herfree.domain.journal.dto.response.JournalTodayStatusLevel;
import com.herfree.domain.journal.dto.response.JournalTrendDirection;
import com.herfree.domain.journal.entity.JournalRecord;
import com.herfree.domain.journal.entity.MedicationStatus;
import com.herfree.domain.journal.entity.MoodType;
import com.herfree.domain.journal.entity.SleepRange;
import com.herfree.domain.journal.entity.StressLevel;
import com.herfree.domain.journal.repository.JournalRecordRepository;
import com.herfree.domain.user.entity.User;
import com.herfree.global.common.AppTimeZone;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class JournalDashboardServiceTest {

    @Mock
    private JournalRecordRepository journalRecordRepository;

    @InjectMocks
    private JournalDashboardService journalDashboardService;

    @Test
    void returnsNotRecordedDashboardWhenTodayHasNoRecord() {
        Long userId = 1L;
        LocalDate today = AppTimeZone.todayKst();

        given(journalRecordRepository.findByUserIdAndRecordDate(userId, today)).willReturn(Optional.empty());
        given(journalRecordRepository.findByUserIdAndHadSymptomsTrueOrderByRecordDateDesc(
                eq(userId), any(PageRequest.class))).willReturn(new PageImpl<>(List.of()));
        given(journalRecordRepository.countByUserIdAndHadSymptomsTrue(userId)).willReturn(0L);
        given(journalRecordRepository.countByUserIdAndHadSymptomsTrueAndRecordDateBetween(
                eq(userId), any(), any())).willReturn(0L);
        given(journalRecordRepository.findByUserIdAndRecordDateBetweenOrderByRecordDateDesc(
                eq(userId), any(), eq(today))).willReturn(List.of());
        given(journalRecordRepository.findFirstByUserIdOrderByRecordDateAsc(userId))
                .willReturn(Optional.empty());

        var dashboard = journalDashboardService.getDashboard(userId);

        assertThat(dashboard.todayStatusLevel()).isEqualTo(JournalTodayStatusLevel.NOT_RECORDED);
        assertThat(dashboard.todayStatusSummary()).isEqualTo("오늘 기록 전이에요");
        assertThat(dashboard.timelineDays()).hasSize(14);
        assertThat(dashboard.trendDirection()).isEqualTo(JournalTrendDirection.UNKNOWN);
    }

    @Test
    void returnsStableStatusAndRoutineProgressForAHealthyTodayRecord() {
        Long userId = 1L;
        LocalDate today = AppTimeZone.todayKst();
        JournalRecord record = record(userId, today, false)
                .sleepHours(new BigDecimal("6.5"))
                .stressLevel(StressLevel.LOW)
                .medicationStatus(MedicationStatus.NORMAL)
                .build();

        stubDashboardWithoutRelapses(userId, today, record);

        var dashboard = journalDashboardService.getDashboard(userId);

        assertThat(dashboard.todayStatusLevel()).isEqualTo(JournalTodayStatusLevel.STABLE);
        assertThat(dashboard.todayStatusSummary()).contains("증상 없음", "6.5h", "스트레스 낮음");
        assertThat(dashboard.routineTotalToday()).isEqualTo(3);
        assertThat(dashboard.routineCompletedToday()).isEqualTo(1);
        assertThat(dashboard.yearRelapses()).isZero();
        assertThat(dashboard.lastRelapseDate()).isNull();
    }

    @Test
    void returnsRelapseStatusWithoutChangingTheExistingDashboardContract() {
        Long userId = 1L;
        LocalDate today = AppTimeZone.todayKst();
        JournalRecord record = record(userId, today, true).severity(4).build();

        given(journalRecordRepository.findByUserIdAndRecordDate(userId, today)).willReturn(Optional.of(record));
        given(journalRecordRepository.findByUserIdAndHadSymptomsTrueOrderByRecordDateDesc(
                eq(userId), any(PageRequest.class))).willReturn(new PageImpl<>(List.of(record)));
        given(journalRecordRepository.countByUserIdAndHadSymptomsTrue(userId)).willReturn(1L);
        given(journalRecordRepository.countByUserIdAndHadSymptomsTrueAndRecordDateBetween(
                eq(userId), any(), any())).willReturn(1L);
        given(journalRecordRepository.findByUserIdAndRecordDateBetweenOrderByRecordDateDesc(
                eq(userId), any(), eq(today))).willReturn(List.of(record));

        var dashboard = journalDashboardService.getDashboard(userId);

        assertThat(dashboard.todayStatusLevel()).isEqualTo(JournalTodayStatusLevel.RELAPSE);
        assertThat(dashboard.todayStatusSummary()).contains("재발");
        assertThat(dashboard.yearRelapses()).isEqualTo(1);
        assertThat(dashboard.lastRelapseDate()).isEqualTo(today.toString());
        assertThat(dashboard.routineCompletedToday()).isZero();
    }

    @Test
    void calculatorCountsTheThreeIndependentRoutineTasks() {
        Long userId = 1L;
        LocalDate today = LocalDate.of(2026, 7, 28);
        JournalRecord record = record(userId, today, false)
                .avgSleep(SleepRange.H7_PLUS)
                .supplementTaken(true)
                .mood(MoodType.PEACEFUL)
                .build();

        var dashboard = new JournalDashboardCalculator().calculate(
                today,
                Optional.of(record),
                List.of(),
                0,
                0,
                0,
                0,
                List.of(record)
        );

        assertThat(dashboard.routineCompletedToday()).isEqualTo(3);
    }

    @Test
    void usesTheFirstRecordDateWhenThereIsNoRelapse() {
        Long userId = 1L;
        LocalDate today = AppTimeZone.todayKst();
        LocalDate firstRecordDate = today.minusDays(12);
        JournalRecord firstRecord = record(userId, firstRecordDate, false).build();

        given(journalRecordRepository.findByUserIdAndRecordDate(userId, today)).willReturn(Optional.empty());
        given(journalRecordRepository.findByUserIdAndHadSymptomsTrueOrderByRecordDateDesc(
                eq(userId), any(PageRequest.class))).willReturn(new PageImpl<>(List.of()));
        given(journalRecordRepository.findFirstByUserIdOrderByRecordDateAsc(userId))
                .willReturn(Optional.of(firstRecord));
        given(journalRecordRepository.countByUserIdAndHadSymptomsTrue(userId)).willReturn(0L);
        given(journalRecordRepository.countByUserIdAndHadSymptomsTrueAndRecordDateBetween(
                eq(userId), any(), any())).willReturn(0L);
        given(journalRecordRepository.findByUserIdAndRecordDateBetweenOrderByRecordDateDesc(
                eq(userId), any(), eq(today))).willReturn(List.of());

        var dashboard = journalDashboardService.getDashboard(userId);

        assertThat(dashboard.relapseFreeDays()).isEqualTo(12);
    }

    private void stubDashboardWithoutRelapses(Long userId, LocalDate today, JournalRecord record) {
        given(journalRecordRepository.findByUserIdAndRecordDate(userId, today)).willReturn(Optional.of(record));
        given(journalRecordRepository.findByUserIdAndHadSymptomsTrueOrderByRecordDateDesc(
                eq(userId), any(PageRequest.class))).willReturn(new PageImpl<>(List.of()));
        given(journalRecordRepository.countByUserIdAndHadSymptomsTrue(userId)).willReturn(0L);
        given(journalRecordRepository.countByUserIdAndHadSymptomsTrueAndRecordDateBetween(
                eq(userId), any(), any())).willReturn(0L);
        given(journalRecordRepository.findByUserIdAndRecordDateBetweenOrderByRecordDateDesc(
                eq(userId), any(), eq(today))).willReturn(List.of(record));
        given(journalRecordRepository.findFirstByUserIdOrderByRecordDateAsc(userId))
                .willReturn(Optional.of(record));
    }

    private JournalRecord.JournalRecordBuilder record(Long userId, LocalDate date, boolean hadSymptoms) {
        User user = User.builder().email("user@example.com").password("password").build();
        ReflectionTestUtils.setField(user, "id", userId);
        return JournalRecord.builder()
                .user(user)
                .recordDate(date)
                .hadSymptoms(hadSymptoms)
                .supplementTaken(false)
                .exerciseDone(false);
    }
}
