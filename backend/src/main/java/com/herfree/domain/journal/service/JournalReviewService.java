package com.herfree.domain.journal.service;

import com.herfree.domain.journal.dto.response.JournalReviewSummaryResponse;
import com.herfree.domain.journal.entity.JournalRecord;
import com.herfree.domain.journal.repository.JournalRecordRepository;
import com.herfree.global.common.AppTimeZone;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Loads a member's review period and delegates all summary rules to a pure calculator. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class JournalReviewService {

    private final JournalRecordRepository journalRecordRepository;
    private final JournalReviewCalculator reviewCalculator = new JournalReviewCalculator();

    public JournalReviewSummaryResponse getReviewSummary(Long userId) {
        LocalDate today = AppTimeZone.todayKst();
        LocalDate periodStart = today.minusDays(JournalReviewCalculator.REVIEW_PERIOD_DAYS - 1L);
        List<JournalRecord> records = journalRecordRepository
                .findByUserIdAndRecordDateBetweenOrderByRecordDateDesc(userId, periodStart, today);
        return reviewCalculator.calculate(today, records);
    }
}
