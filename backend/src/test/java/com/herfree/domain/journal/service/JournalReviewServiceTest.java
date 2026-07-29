package com.herfree.domain.journal.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;

import com.herfree.domain.journal.dto.response.JournalSeverityTier;
import com.herfree.domain.journal.entity.JournalRecord;
import com.herfree.domain.journal.entity.MedicationStatus;
import com.herfree.domain.journal.entity.SleepRange;
import com.herfree.domain.journal.entity.StressLevel;
import com.herfree.domain.journal.repository.JournalRecordRepository;
import com.herfree.domain.user.entity.User;
import com.herfree.global.common.AppTimeZone;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class JournalReviewServiceTest {

    @Mock
    private JournalRecordRepository journalRecordRepository;

    @InjectMocks
    private JournalReviewService journalReviewService;

    @Test
    void aggregatesAThirtyDayReviewWithoutReadingTheClockInTheCalculator() {
        Long userId = 1L;
        LocalDate today = AppTimeZone.todayKst();
        JournalRecord symptomDay = symptomRecord(userId, today.minusDays(2));

        given(journalRecordRepository.findByUserIdAndRecordDateBetweenOrderByRecordDateDesc(
                eq(userId), any(), eq(today))).willReturn(List.of(symptomDay));

        var summary = journalReviewService.getReviewSummary(userId);

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
    void calculatorUsesItsExplicitDateForPeriodBoundaries() {
        LocalDate today = LocalDate.of(2026, 7, 28);
        var summary = new JournalReviewCalculator().calculate(today, List.of());

        assertThat(summary.periodStart()).isEqualTo("2026-06-29");
        assertThat(summary.periodEnd()).isEqualTo("2026-07-28");
        assertThat(summary.timelineDays()).hasSize(30);
    }

    private JournalRecord symptomRecord(Long userId, LocalDate recordDate) {
        User user = User.builder().email("user@example.com").password("password").build();
        ReflectionTestUtils.setField(user, "id", userId);
        return JournalRecord.builder()
                .user(user)
                .recordDate(recordDate)
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
    }
}
