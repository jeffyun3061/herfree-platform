package com.herfree.domain.journal.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.herfree.domain.analytics.service.AnalyticsService;
import com.herfree.domain.journal.dto.request.JournalRecordUpsertRequest;
import com.herfree.domain.journal.entity.JournalRecord;
import com.herfree.domain.journal.entity.SleepRange;
import com.herfree.domain.journal.exception.JournalRecordNotFoundException;
import com.herfree.domain.journal.repository.JournalRecordRepository;
import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.repository.UserRepository;
import com.herfree.global.common.AppTimeZone;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class JournalRecordServiceTest {

    @Mock
    private JournalRecordRepository journalRecordRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AnalyticsService analyticsService;

    @Mock
    private JournalRecordInputValidator inputValidator;

    @InjectMocks
    private JournalRecordService journalRecordService;

    @Test
    void deletesOnlyTheOwnersRecord() {
        Long userId = 1L;
        JournalRecord record = record(userId, AppTimeZone.todayKst());
        given(journalRecordRepository.findById(10L)).willReturn(Optional.of(record));

        journalRecordService.deleteRecord(userId, 10L);

        verify(journalRecordRepository).delete(record);
    }

    @Test
    void hidesOtherUsersRecordsAsNotFound() {
        JournalRecord record = record(2L, AppTimeZone.todayKst());
        given(journalRecordRepository.findById(10L)).willReturn(Optional.of(record));

        assertThatThrownBy(() -> journalRecordService.deleteRecord(1L, 10L))
                .isInstanceOf(JournalRecordNotFoundException.class);
    }

    @Test
    void derivesRepresentativeSleepHoursAndRecordsCreateAnalyticsForANewRecord() {
        Long userId = 1L;
        LocalDate date = LocalDate.of(2026, 7, 28);
        User user = user(userId);
        JournalRecordUpsertRequest request = new JournalRecordUpsertRequest(
                date,
                null,
                SleepRange.H6_7,
                null,
                false,
                List.of(),
                null,
                List.of(),
                null,
                null,
                null,
                false,
                false
        );
        given(userRepository.findById(userId)).willReturn(Optional.of(user));
        given(journalRecordRepository.findByUserIdAndRecordDate(userId, date)).willReturn(Optional.empty());
        given(journalRecordRepository.save(any(JournalRecord.class)))
                .willAnswer(invocation -> invocation.getArgument(0));

        var response = journalRecordService.upsertRecord(userId, request);

        assertThat(response.recordDate()).isEqualTo(date.toString());
        assertThat(response.sleepHours()).isEqualByComparingTo("6.5");
        verify(analyticsService).recordBackendEvent(AnalyticsService.JOURNAL_CREATED, userId);
    }

    @Test
    void doesNotCreateAnotherAnalyticsEventWhenUpdatingTheSameDate() {
        Long userId = 1L;
        LocalDate date = LocalDate.of(2026, 7, 28);
        User user = user(userId);
        JournalRecord existing = record(userId, date);
        JournalRecordUpsertRequest request = new JournalRecordUpsertRequest(
                date, null, null, null, false, List.of(), null, List.of(), null, null, null, false, false);
        given(userRepository.findById(userId)).willReturn(Optional.of(user));
        given(journalRecordRepository.findByUserIdAndRecordDate(userId, date)).willReturn(Optional.of(existing));
        given(journalRecordRepository.save(existing)).willReturn(existing);

        journalRecordService.upsertRecord(userId, request);

        verify(analyticsService, never()).recordBackendEvent(any(), any());
    }

    private JournalRecord record(Long userId, LocalDate date) {
        return JournalRecord.builder()
                .user(user(userId))
                .recordDate(date)
                .hadSymptoms(false)
                .supplementTaken(false)
                .exerciseDone(false)
                .build();
    }

    private User user(Long userId) {
        User user = User.builder().email("user-" + userId + "@example.com").password("password").build();
        ReflectionTestUtils.setField(user, "id", userId);
        return user;
    }
}
