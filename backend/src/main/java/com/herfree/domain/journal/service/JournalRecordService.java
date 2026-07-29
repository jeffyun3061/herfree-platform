package com.herfree.domain.journal.service;

import com.herfree.domain.analytics.service.AnalyticsService;
import com.herfree.domain.journal.dto.request.JournalRecordUpsertRequest;
import com.herfree.domain.journal.dto.response.JournalRecordResponse;
import com.herfree.domain.journal.entity.JournalRecord;
import com.herfree.domain.journal.entity.SleepRange;
import com.herfree.domain.journal.exception.JournalRecordNotFoundException;
import com.herfree.domain.journal.repository.JournalRecordRepository;
import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.exception.UserNotFoundException;
import com.herfree.domain.user.repository.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Owns a member's journal records and their ownership checks. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class JournalRecordService {

    private final JournalRecordRepository journalRecordRepository;
    private final UserRepository userRepository;
    private final AnalyticsService analyticsService;
    private final JournalRecordInputValidator inputValidator;

    @Transactional
    public JournalRecordResponse upsertRecord(Long userId, JournalRecordUpsertRequest request) {
        inputValidator.validate(request);
        User user = userRepository.findById(userId).orElseThrow(UserNotFoundException::new);

        boolean supplementTaken = Boolean.TRUE.equals(request.supplementTaken());
        boolean exerciseDone = Boolean.TRUE.equals(request.exerciseDone());
        boolean hadSymptoms = Boolean.TRUE.equals(request.hadSymptoms());
        BigDecimal sleepHours = request.sleepHours() != null
                ? request.sleepHours()
                : representativeSleepHours(request.avgSleep());

        Optional<JournalRecord> existingRecord = journalRecordRepository
                .findByUserIdAndRecordDate(userId, request.recordDate());
        JournalRecord record = existingRecord
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
                sleepHours,
                supplementTaken,
                exerciseDone
        );

        JournalRecord saved = journalRecordRepository.save(record);
        if (existingRecord.isEmpty()) {
            recordAnalyticsEvent(AnalyticsService.JOURNAL_CREATED, userId);
        }
        return JournalRecordResponse.from(saved);
    }

    @Transactional
    public void deleteRecord(Long userId, Long recordId) {
        JournalRecord record = journalRecordRepository.findById(recordId)
                .orElseThrow(JournalRecordNotFoundException::new);
        assertOwner(record, userId);
        journalRecordRepository.delete(record);
    }

    public JournalRecordResponse getRecord(Long userId, Long recordId) {
        JournalRecord record = journalRecordRepository.findById(recordId)
                .orElseThrow(JournalRecordNotFoundException::new);
        assertOwner(record, userId);
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

    public List<JournalRecordResponse> getMonthlyRecords(Long userId, int year, int month, Boolean hadSymptoms) {
        YearMonth targetMonth = YearMonth.of(year, month);
        List<JournalRecord> records = journalRecordRepository.findByUserIdAndRecordDateBetweenOrderByRecordDateDesc(
                userId,
                targetMonth.atDay(1),
                targetMonth.atEndOfMonth()
        );
        return records.stream()
                .filter(record -> !Boolean.TRUE.equals(hadSymptoms) || record.isHadSymptoms())
                .map(JournalRecordResponse::from)
                .toList();
    }

    private void assertOwner(JournalRecord record, Long userId) {
        if (!record.getUser().getId().equals(userId)) {
            throw new JournalRecordNotFoundException();
        }
    }

    private BigDecimal representativeSleepHours(SleepRange avgSleep) {
        if (avgSleep == null) {
            return null;
        }
        return switch (avgSleep) {
            case UNDER_5 -> BigDecimal.valueOf(4.5);
            case H5_6 -> BigDecimal.valueOf(5.5);
            case H6_7 -> BigDecimal.valueOf(6.5);
            case H7_PLUS -> BigDecimal.valueOf(7.5);
        };
    }

    private void recordAnalyticsEvent(String eventName, Long userId) {
        if (analyticsService != null) {
            analyticsService.recordBackendEvent(eventName, userId);
        }
    }
}
