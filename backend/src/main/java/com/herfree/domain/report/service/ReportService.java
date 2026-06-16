package com.herfree.domain.report.service;

import com.herfree.domain.comment.entity.Comment;
import com.herfree.domain.comment.entity.CommentStatus;
import com.herfree.domain.comment.exception.CommentNotFoundException;
import com.herfree.domain.comment.repository.CommentRepository;
import com.herfree.domain.post.entity.Post;
import com.herfree.domain.post.entity.PostStatus;
import com.herfree.domain.post.exception.PostNotFoundException;
import com.herfree.domain.post.repository.PostRepository;
import com.herfree.domain.report.dto.request.ReportCreateRequest;
import com.herfree.domain.report.dto.request.ReportProcessRequest;
import com.herfree.domain.report.dto.response.ReportResponse;
import com.herfree.domain.report.entity.Report;
import com.herfree.domain.report.entity.ReportStatus;
import com.herfree.domain.report.entity.ReportTargetType;
import com.herfree.domain.report.exception.DuplicateReportException;
import com.herfree.domain.report.exception.ReportNotFoundException;
import com.herfree.domain.report.exception.SelfReportException;
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
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;

    @Transactional
    public ReportResponse createReport(Long reporterId, ReportCreateRequest request) {
        if (reportRepository.existsByReporterIdAndTargetTypeAndTargetId(
                reporterId, request.targetType(), request.targetId())) {
            throw new DuplicateReportException();
        }

        assertNotSelfReport(reporterId, request);

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

    private void assertNotSelfReport(Long reporterId, ReportCreateRequest request) {
        Long authorId = switch (request.targetType()) {
            case POST -> postRepository.findByIdAndStatus(request.targetId(), PostStatus.ACTIVE)
                    .map(post -> post.getUser().getId())
                    .orElseThrow(PostNotFoundException::new);
            case COMMENT -> commentRepository.findById(request.targetId())
                    .filter(comment -> comment.getStatus() == CommentStatus.ACTIVE)
                    .map(comment -> comment.getUser().getId())
                    .orElseThrow(CommentNotFoundException::new);
            case USER -> request.targetId();
        };

        if (authorId.equals(reporterId)) {
            throw new SelfReportException();
        }
    }

    @Transactional(readOnly = true)
    public Page<ReportResponse> getReports(ReportStatus status, Pageable pageable) {
        return reportRepository.findByStatusOrderByCreatedAtDesc(status, pageable)
                .map(ReportResponse::from);
    }

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
