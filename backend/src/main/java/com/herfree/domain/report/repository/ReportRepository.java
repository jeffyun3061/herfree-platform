package com.herfree.domain.report.repository;

import com.herfree.domain.report.entity.Report;
import com.herfree.domain.report.entity.ReportStatus;
import com.herfree.domain.report.entity.ReportTargetType;
import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReportRepository extends JpaRepository<Report, Long> {

    // 동일 사용자가 동일 대상을 중복 신고하는지 확인한다
    boolean existsByReporterIdAndTargetTypeAndTargetId(
            Long reporterId, ReportTargetType targetType, Long targetId);

    // 관리자가 상태별로 신고 목록을 조회할 때 사용
    @EntityGraph(attributePaths = {"reporter", "processedBy"})
    Page<Report> findByStatusOrderByCreatedAtDesc(ReportStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"reporter", "processedBy"})
    List<Report> findByStatusAndTargetTypeAndTargetId(
            ReportStatus status, ReportTargetType targetType, Long targetId);

    @Query("""
            SELECT r.targetType AS targetType,
                   r.targetId AS targetId,
                   COUNT(r) AS reportCount,
                   MAX(r.createdAt) AS lastReportedAt
            FROM Report r
            WHERE r.status = :status
            GROUP BY r.targetType, r.targetId
            HAVING COUNT(r) >= :minCount
            ORDER BY COUNT(r) DESC, MAX(r.createdAt) DESC
            """)
    List<ReportTargetSummary> findTargetSummaries(
            @Param("status") ReportStatus status,
            @Param("minCount") long minCount,
            Pageable pageable);

    long countByStatus(ReportStatus status);

    long countByStatusAndCreatedAtAfter(ReportStatus status, Instant since);
}
