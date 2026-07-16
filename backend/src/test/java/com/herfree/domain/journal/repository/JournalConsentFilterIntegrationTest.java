package com.herfree.domain.journal.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.sql.Date;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

@DataJpaTest
@ActiveProfiles("test")
class JournalConsentFilterIntegrationTest {

    private static final long USER_ID = 9401L;
    private static final long JOURNAL_ID = 9401L;
    private static final LocalDate RECORD_DATE = LocalDate.of(2026, 7, 16);

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private JournalRecordRepository journalRecordRepository;

    @BeforeEach
    void setUp() {
        Instant now = Instant.now();
        jdbcTemplate.update("""
                INSERT INTO users (id, email, password, role, status, created_at, updated_at)
                VALUES (?, 'consent-filter@herfree.local', 'encoded', 'USER', 'ACTIVE', ?, ?)
                """, USER_ID, Timestamp.from(now), Timestamp.from(now));
        jdbcTemplate.update("""
                INSERT INTO journal_records (
                    id, user_id, record_date, had_symptoms, prodromal_symptoms, triggers,
                    supplement_taken, exercise_done, created_at, updated_at
                ) VALUES (?, ?, ?, true, 'AURA', 'STRESS', false, false, ?, ?)
                """, JOURNAL_ID, USER_ID, Date.valueOf(RECORD_DATE), Timestamp.from(now), Timestamp.from(now));
        insertConsent(9401L, true, now.minusSeconds(60));
    }

    @Test
    void latestWithdrawalImmediatelyExcludesHealthRecordsFromStatistics() {
        assertIncluded();

        insertConsent(9402L, false, Instant.now());

        assertExcluded();
    }

    @Test
    void latestReconsentIncludesHealthRecordsAgain() {
        insertConsent(9402L, false, Instant.now().minusSeconds(30));
        assertExcluded();

        insertConsent(9403L, true, Instant.now());

        assertIncluded();
    }

    private void assertIncluded() {
        assertThat(journalRecordRepository.countConsentedRecords()).isEqualTo(1);
        assertThat(journalRecordRepository.countConsentedSymptomRecords()).isEqualTo(1);
        assertThat(journalRecordRepository.countDistinctConsentedUsers()).isEqualTo(1);
        assertThat(journalRecordRepository.countDistinctConsentedUsersByRecordDate(RECORD_DATE)).isEqualTo(1);
        assertThat(journalRecordRepository.countConsentedRecordsBetween(RECORD_DATE, RECORD_DATE)).isEqualTo(1);
        assertThat(journalRecordRepository.countConsentedSymptomRecordsBetween(RECORD_DATE, RECORD_DATE))
                .isEqualTo(1);
        assertThat(journalRecordRepository.findRecentConsentedSymptomRecords(
                RECORD_DATE.minusDays(1), PageRequest.of(0, 10))).hasSize(1);
    }

    private void assertExcluded() {
        assertThat(journalRecordRepository.countConsentedRecords()).isZero();
        assertThat(journalRecordRepository.countConsentedSymptomRecords()).isZero();
        assertThat(journalRecordRepository.countDistinctConsentedUsers()).isZero();
        assertThat(journalRecordRepository.countDistinctConsentedUsersByRecordDate(RECORD_DATE)).isZero();
        assertThat(journalRecordRepository.countConsentedRecordsBetween(RECORD_DATE, RECORD_DATE)).isZero();
        assertThat(journalRecordRepository.countConsentedSymptomRecordsBetween(RECORD_DATE, RECORD_DATE)).isZero();
        assertThat(journalRecordRepository.findRecentConsentedSymptomRecords(
                RECORD_DATE.minusDays(1), PageRequest.of(0, 10))).isEmpty();
    }

    private void insertConsent(long id, boolean agreed, Instant createdAt) {
        jdbcTemplate.update("""
                INSERT INTO health_statistics_consents (
                    id, user_id, agreed, policy_version, created_at, updated_at
                ) VALUES (?, ?, ?, '2026-07-16', ?, ?)
                """, id, USER_ID, agreed, Timestamp.from(createdAt), Timestamp.from(createdAt));
    }
}
