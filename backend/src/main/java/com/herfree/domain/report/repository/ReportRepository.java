package com.herfree.domain.report.repository;

import com.herfree.domain.report.entity.Report;
import com.herfree.domain.report.entity.ReportStatus;
import com.herfree.domain.report.entity.ReportTargetType;
import java.time.LocalDateTime;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReportRepository extends JpaRepository<Report, Long> {

    // 동일 사용자가 동일 대상을 중복 신고하는지 확인한다
    boolean existsByReporterIdAndTargetTypeAndTargetId(
            Long reporterId, ReportTargetType targetType, Long targetId);

    // 관리자가 상태별로 신고 목록을 조회할 때 사용
    Page<Report> findByStatusOrderByCreatedAtDesc(ReportStatus status, Pageable pageable);

    long countByStatus(ReportStatus status);

    long countByStatusAndCreatedAtAfter(ReportStatus status, LocalDateTime since);
}
