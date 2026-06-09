package com.herfree.domain.report.repository;

import com.herfree.domain.report.entity.Report;
import com.herfree.domain.report.entity.ReportStatus;
import com.herfree.domain.report.entity.ReportTargetType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReportRepository extends JpaRepository<Report, Long> {

    // 동일 신고자가 동일 대상을 이미 신고했는지 확인한다.
    // DB UNIQUE 제약과 이중으로 방어해 race condition 발생 시에도 예외를 명시적으로 처리할 수 있다.
    boolean existsByReporterIdAndTargetTypeAndTargetId(
            Long reporterId, ReportTargetType targetType, Long targetId);

    // 관리자 신고 목록 조회 — status 필터링과 페이지네이션을 함께 처리한다
    Page<Report> findByStatusOrderByCreatedAtDesc(ReportStatus status, Pageable pageable);

    // status 없이 전체 목록 조회 (status=null로 전체 조회 가능하게 하기 위한 오버로드)
    Page<Report> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
