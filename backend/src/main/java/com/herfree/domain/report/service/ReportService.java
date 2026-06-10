package com.herfree.domain.report.service;

import com.herfree.domain.report.dto.request.ReportCreateRequest;
import com.herfree.domain.report.dto.request.ReportProcessRequest;
import com.herfree.domain.report.dto.response.ReportResponse;
import com.herfree.domain.report.entity.Report;
import com.herfree.domain.report.entity.ReportStatus;
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

    // 신고 등록 — 동일 사용자가 동일 대상을 중복 신고하면 409를 반환한다
    @Transactional
    public ReportResponse createReport(Long reporterId, ReportCreateRequest request) {
        if (reportRepository.existsByReporterIdAndTargetTypeAndTargetId(
                reporterId, request.targetType(), request.targetId())) {
            throw new DuplicateReportException();
        }

        User reporter = userRepository.findById(reporterId)
                .orElseThrow(UserNotFoundException::new);

        Report report = Report.builder()
                .reporter(reporter)
                .targetType(request.targetType())
                .targetId(request.targetId())
                .reason(request.reason())
                .detail(request.detail())
                .build();

        return ReportResponse.from(reportRepository.save(report));
    }

    // 관리자 전용 — 처리 대기 중인 신고 목록을 최신순으로 조회한다
    @Transactional(readOnly = true)
    public Page<ReportResponse> getReports(ReportStatus status, Pageable pageable) {
        return reportRepository.findByStatusOrderByCreatedAtDesc(status, pageable)
                .map(ReportResponse::from);
    }

    // 신고 처리 — 인정(ACCEPTED) 또는 기각(REJECTED) 상태로 변경하고 처리자를 기록한다
    @Transactional
    public ReportResponse processReport(Long adminId, Long reportId, ReportProcessRequest request) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(ReportNotFoundException::new);

        User admin = userRepository.findById(adminId)
                .orElseThrow(UserNotFoundException::new);

        if (request.status() == ReportStatus.ACCEPTED) {
            report.accept(admin);
        } else {
            report.reject(admin);
        }

        return ReportResponse.from(report);
    }
}
