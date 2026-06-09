package com.herfree.domain.report.service;

import com.herfree.domain.report.dto.request.ReportCreateRequest;
import com.herfree.domain.report.dto.request.ReportProcessRequest;
import com.herfree.domain.report.dto.response.ReportResponse;
import com.herfree.domain.report.entity.Report;
import com.herfree.domain.report.entity.ReportStatus;
import com.herfree.domain.report.entity.ReportTargetType;
import com.herfree.domain.report.exception.DuplicateReportException;
import com.herfree.domain.report.exception.ReportNotFoundException;
import com.herfree.domain.report.repository.ReportRepository;
import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.exception.UserNotFoundException;
import com.herfree.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;

    // 신고 접수 — 동일 대상 중복 신고는 거부한다.
    // DB UNIQUE 제약이 있지만 애플리케이션 레벨에서도 체크해 명시적인 에러 메시지를 반환한다.
    @Transactional
    public ReportResponse createReport(Long userId, ReportCreateRequest request) {
        User reporter = userRepository.findById(userId)
                .orElseThrow(UserNotFoundException::new);

        ReportTargetType targetType = ReportTargetType.valueOf(request.targetType().toUpperCase());

        // 중복 신고 방지 — 같은 사용자가 같은 대상을 두 번 신고하는 것을 막는다
        if (reportRepository.existsByReporterIdAndTargetTypeAndTargetId(userId, targetType, request.targetId())) {
            throw new DuplicateReportException();
        }

        Report report = Report.builder()
                .reporter(reporter)
                .targetType(targetType)
                .targetId(request.targetId())
                .reason(request.reason())
                .detail(request.detail())
                .build();

        reportRepository.save(report);

        return ReportResponse.from(report);
    }

    // 관리자 신고 목록 조회 — status 파라미터가 있으면 필터링, 없으면 전체 조회
    @Transactional(readOnly = true)
    public Page<ReportResponse> getReports(String status, Pageable pageable) {
        if (status != null && !status.isBlank()) {
            ReportStatus reportStatus = ReportStatus.valueOf(status.toUpperCase());
            return reportRepository.findByStatusOrderByCreatedAtDesc(reportStatus, pageable)
                    .map(ReportResponse::from);
        }
        return reportRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(ReportResponse::from);
    }

    // 신고 처리 — 수락 또는 기각. 수락 시 콘텐츠 숨김은 별도 관리자 액션으로 처리한다.
    // 1차 MVP에서는 신고 수락이 자동으로 콘텐츠를 숨기지 않는다.
    // 필요 시 향후 여기서 PostService.hidePost() 또는 CommentService.hideComment()를 호출할 수 있다.
    @Transactional
    public ReportResponse processReport(Long adminId, Long reportId, ReportProcessRequest request) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(ReportNotFoundException::new);

        String action = request.action().toUpperCase();
        if ("ACCEPTED".equals(action)) {
            report.accept(adminId);
        } else {
            report.reject(adminId);
        }

        return ReportResponse.from(report);
    }
}
