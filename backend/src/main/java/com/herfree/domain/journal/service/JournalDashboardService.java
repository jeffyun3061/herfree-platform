package com.herfree.domain.journal.service;

import com.herfree.domain.journal.dto.response.JournalDashboardResponse;
import com.herfree.domain.journal.entity.JournalRecord;
import com.herfree.domain.journal.repository.JournalRecordRepository;
import com.herfree.global.common.AppTimeZone;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Loads a member dashboard and delegates its deterministic projection to a pure calculator. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class JournalDashboardService {

    private final JournalRecordRepository journalRecordRepository;
    private final JournalDashboardCalculator dashboardCalculator = new JournalDashboardCalculator();

    public JournalDashboardResponse getDashboard(Long userId) {
        LocalDate today = AppTimeZone.todayKst();
        YearMonth month = YearMonth.from(today);

        Optional<JournalRecord> todayEntity = journalRecordRepository.findByUserIdAndRecordDate(userId, today);
        List<JournalRecord> recentRelapses = journalRecordRepository
                .findByUserIdAndHadSymptomsTrueOrderByRecordDateDesc(userId, PageRequest.of(0, 5))
                .getContent();

        long daysSinceFirstRecordOrZero = recentRelapses.isEmpty()
                ? journalRecordRepository.findFirstByUserIdOrderByRecordDateAsc(userId)
                        .map(record -> ChronoUnit.DAYS.between(record.getRecordDate(), today))
                        .orElse(0L)
                : 0L;

        int totalRelapses = (int) journalRecordRepository.countByUserIdAndHadSymptomsTrue(userId);
        int monthRelapses = (int) journalRecordRepository.countByUserIdAndHadSymptomsTrueAndRecordDateBetween(
                userId, month.atDay(1), month.atEndOfMonth());
        LocalDate yearStart = LocalDate.of(today.getYear(), 1, 1);
        LocalDate yearEnd = LocalDate.of(today.getYear(), 12, 31);
        int yearRelapses = (int) journalRecordRepository.countByUserIdAndHadSymptomsTrueAndRecordDateBetween(
                userId, yearStart, yearEnd);

        LocalDate timelineStart = today.minusDays(JournalDashboardCalculator.TIMELINE_DAYS - 1L);
        List<JournalRecord> timelineRecords = journalRecordRepository
                .findByUserIdAndRecordDateBetweenOrderByRecordDateDesc(userId, timelineStart, today);

        return dashboardCalculator.calculate(
                today,
                todayEntity,
                recentRelapses,
                daysSinceFirstRecordOrZero,
                totalRelapses,
                monthRelapses,
                yearRelapses,
                timelineRecords
        );
    }
}
