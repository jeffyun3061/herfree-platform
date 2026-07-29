package com.herfree.domain.journal.repository;

import com.herfree.domain.journal.entity.JournalRecord;
import java.time.LocalDate;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface JournalRecordRepository extends JpaRepository<JournalRecord, Long> {

    Optional<JournalRecord> findByUserIdAndRecordDate(Long userId, LocalDate recordDate);

    Page<JournalRecord> findByUserIdOrderByRecordDateDesc(Long userId, Pageable pageable);

    Optional<JournalRecord> findFirstByUserIdOrderByRecordDateAsc(Long userId);

    Page<JournalRecord> findByUserIdAndHadSymptomsTrueOrderByRecordDateDesc(Long userId, Pageable pageable);

    List<JournalRecord> findByUserIdAndRecordDateBetweenOrderByRecordDateDesc(
            Long userId, LocalDate from, LocalDate to);

    @Query("""
            SELECT r FROM JournalRecord r
            JOIN FETCH r.user
            WHERE r.hadSymptoms = true
            AND r.recordDate >= :since
            AND EXISTS (
                SELECT c.id FROM HealthStatisticsConsent c
                WHERE c.user = r.user
                AND c.agreed = true
                AND c.id = (
                    SELECT MAX(c2.id) FROM HealthStatisticsConsent c2
                    WHERE c2.user = r.user
                )
            )
            ORDER BY r.recordDate DESC
            """)
    List<JournalRecord> findRecentConsentedSymptomRecords(@Param("since") LocalDate since, Pageable pageable);

    long countByUserIdAndHadSymptomsTrue(Long userId);

    long countByUserIdAndHadSymptomsTrueAndRecordDateBetween(
            Long userId, LocalDate from, LocalDate to);

    long countByCreatedAtAfter(Instant since);

    long countByUserIdAndRecordDateBetween(Long userId, LocalDate from, LocalDate to);

    @Query("""
            SELECT COUNT(r.id) FROM JournalRecord r
            WHERE EXISTS (
                SELECT c.id FROM HealthStatisticsConsent c
                WHERE c.user = r.user
                AND c.agreed = true
                AND c.id = (
                    SELECT MAX(c2.id) FROM HealthStatisticsConsent c2
                    WHERE c2.user = r.user
                )
            )
            """)
    long countConsentedRecords();

    @Query("""
            SELECT COUNT(r.id) FROM JournalRecord r
            WHERE r.hadSymptoms = true
            AND EXISTS (
                SELECT c.id FROM HealthStatisticsConsent c
                WHERE c.user = r.user
                AND c.agreed = true
                AND c.id = (
                    SELECT MAX(c2.id) FROM HealthStatisticsConsent c2
                    WHERE c2.user = r.user
                )
            )
            """)
    long countConsentedSymptomRecords();

    @Query("""
            SELECT COUNT(r.id) FROM JournalRecord r
            WHERE r.recordDate BETWEEN :from AND :to
            AND EXISTS (
                SELECT c.id FROM HealthStatisticsConsent c
                WHERE c.user = r.user
                AND c.agreed = true
                AND c.id = (
                    SELECT MAX(c2.id) FROM HealthStatisticsConsent c2
                    WHERE c2.user = r.user
                )
            )
            """)
    long countConsentedRecordsBetween(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("""
            SELECT COUNT(r.id) FROM JournalRecord r
            WHERE r.hadSymptoms = true
            AND r.recordDate BETWEEN :from AND :to
            AND EXISTS (
                SELECT c.id FROM HealthStatisticsConsent c
                WHERE c.user = r.user
                AND c.agreed = true
                AND c.id = (
                    SELECT MAX(c2.id) FROM HealthStatisticsConsent c2
                    WHERE c2.user = r.user
                )
            )
            """)
    long countConsentedSymptomRecordsBetween(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("""
            SELECT COUNT(DISTINCT r.user.id) FROM JournalRecord r
            WHERE EXISTS (
                SELECT c.id FROM HealthStatisticsConsent c
                WHERE c.user = r.user
                AND c.agreed = true
                AND c.id = (
                    SELECT MAX(c2.id) FROM HealthStatisticsConsent c2
                    WHERE c2.user = r.user
                )
            )
            """)
    long countDistinctConsentedUsers();

    @Query("""
            SELECT COUNT(DISTINCT r.user.id) FROM JournalRecord r
            WHERE r.recordDate = :date
            AND EXISTS (
                SELECT c.id FROM HealthStatisticsConsent c
                WHERE c.user = r.user
                AND c.agreed = true
                AND c.id = (
                    SELECT MAX(c2.id) FROM HealthStatisticsConsent c2
                    WHERE c2.user = r.user
                )
            )
            """)
    long countDistinctConsentedUsersByRecordDate(@Param("date") LocalDate date);

    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM JournalRecord r WHERE r.user.id = :userId")
    void deleteAllByUserId(@Param("userId") Long userId);
}
