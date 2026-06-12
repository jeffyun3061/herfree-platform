package com.herfree.domain.journal.repository;

import com.herfree.domain.journal.entity.JournalRecord;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface JournalRecordRepository extends JpaRepository<JournalRecord, Long> {

    Optional<JournalRecord> findByUserIdAndRecordDate(Long userId, LocalDate recordDate);

    Page<JournalRecord> findByUserIdOrderByRecordDateDesc(Long userId, Pageable pageable);

    List<JournalRecord> findByUserIdAndHadSymptomsTrueOrderByRecordDateDesc(Long userId, Pageable pageable);

    List<JournalRecord> findByUserIdAndRecordDateBetweenOrderByRecordDateDesc(
            Long userId, LocalDate from, LocalDate to);

    @Query("""
            SELECT r FROM JournalRecord r
            WHERE r.hadSymptoms = true
            AND r.recordDate >= :since
            ORDER BY r.recordDate DESC
            """)
    List<JournalRecord> findRecentSymptomRecords(@Param("since") LocalDate since, Pageable pageable);

    long countByUserIdAndHadSymptomsTrue(Long userId);

    long countByUserIdAndHadSymptomsTrueAndRecordDateBetween(
            Long userId, LocalDate from, LocalDate to);

    long countByHadSymptomsTrue();

    @Query("SELECT COUNT(DISTINCT r.user.id) FROM JournalRecord r")
    long countDistinctUsers();
}
