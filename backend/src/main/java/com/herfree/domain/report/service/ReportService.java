package com.herfree.domain.report.service;

import com.herfree.domain.comment.entity.Comment;
import com.herfree.domain.comment.entity.CommentStatus;
import com.herfree.domain.comment.exception.CommentNotFoundException;
import com.herfree.domain.comment.repository.CommentRepository;
import com.herfree.domain.analytics.service.AnalyticsService;
import com.herfree.domain.post.entity.Post;
import com.herfree.domain.post.entity.PostStatus;
import com.herfree.domain.post.exception.PostNotFoundException;
import com.herfree.domain.post.repository.PostRepository;
import com.herfree.domain.report.dto.request.ReportCreateRequest;
import com.herfree.domain.report.dto.request.ReportProcessRequest;
import com.herfree.domain.report.dto.response.AdminReportTargetResponse;
import com.herfree.domain.report.dto.response.ReportResponse;
import com.herfree.domain.report.entity.Report;
import com.herfree.domain.report.entity.ReportStatus;
import com.herfree.domain.report.entity.ReportTargetType;
import com.herfree.domain.report.exception.DuplicateReportException;
import com.herfree.domain.report.exception.ReportNotFoundException;
import com.herfree.domain.report.exception.SelfReportException;
import com.herfree.domain.report.repository.ReportRepository;
import com.herfree.domain.report.repository.ReportTargetSummary;
import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.entity.UserProfile;
import com.herfree.domain.user.exception.UserNotFoundException;
import com.herfree.domain.user.repository.UserProfileRepository;
import com.herfree.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final AnalyticsService analyticsService;

    private static final int URGENT_REPORT_THRESHOLD = 10;

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

    @Transactional(readOnly = true)
    public java.util.List<AdminReportTargetResponse> getPendingTargets(int minCount, int size) {
        int safeMinCount = Math.max(1, minCount);
        int safeSize = Math.min(Math.max(size, 1), 100);
        return reportRepository
                .findTargetSummaries(ReportStatus.PENDING, safeMinCount, PageRequest.of(0, safeSize))
                .stream()
                .map(this::toTargetResponse)
                .toList();
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

        recordAnalyticsEvent(AnalyticsService.ADMIN_ACTION, adminId);
        return ReportResponse.from(report);
    }

    @Transactional
    public java.util.List<ReportResponse> processTargetReports(
            Long adminId,
            ReportTargetType targetType,
            Long targetId,
            ReportProcessRequest request
    ) {
        User admin = userRepository.findById(adminId)
                .orElseThrow(UserNotFoundException::new);
        java.util.List<Report> reports = reportRepository.findByStatusAndTargetTypeAndTargetId(
                ReportStatus.PENDING, targetType, targetId);

        for (Report report : reports) {
            if (request.status() == ReportStatus.ACCEPTED) {
                report.accept(admin);
            } else {
                report.reject(admin);
            }
        }
        recordAnalyticsEvent(AnalyticsService.ADMIN_ACTION, adminId);
        return reports.stream().map(ReportResponse::from).toList();
    }

    private AdminReportTargetResponse toTargetResponse(ReportTargetSummary summary) {
        TargetSnapshot snapshot = resolveTargetSnapshot(summary.getTargetType(), summary.getTargetId());
        return new AdminReportTargetResponse(
                summary.getTargetType(),
                summary.getTargetId(),
                summary.getReportCount(),
                summary.getReportCount() >= URGENT_REPORT_THRESHOLD,
                summary.getLastReportedAt(),
                snapshot.title(),
                snapshot.preview(),
                snapshot.status(),
                snapshot.authorId(),
                snapshot.authorNickname()
        );
    }

    private TargetSnapshot resolveTargetSnapshot(ReportTargetType targetType, Long targetId) {
        return switch (targetType) {
            case POST -> postRepository.findByIdAndStatusIn(
                            targetId,
                            java.util.List.of(PostStatus.ACTIVE, PostStatus.HIDDEN))
                    .map(post -> new TargetSnapshot(
                            post.getTitle(),
                            preview(post.getContent()),
                            post.getStatus().name(),
                            post.getUser().getId(),
                            nicknameOf(post.getUser().getId())))
                    .orElse(new TargetSnapshot("삭제된 게시글", null, "DELETED", null, null));
            case COMMENT -> commentRepository.findByIdAndStatusIn(
                            targetId,
                            java.util.List.of(CommentStatus.ACTIVE, CommentStatus.HIDDEN))
                    .map(comment -> new TargetSnapshot(
                            "댓글 #" + comment.getId(),
                            preview(comment.getContent()),
                            comment.getStatus().name(),
                            comment.getUser().getId(),
                            nicknameOf(comment.getUser().getId())))
                    .orElse(new TargetSnapshot("삭제된 댓글", null, "DELETED", null, null));
            case USER -> userRepository.findById(targetId)
                    .map(user -> new TargetSnapshot(
                            "회원 #" + user.getId(),
                            user.getEmail(),
                            user.getStatus().name(),
                            user.getId(),
                            nicknameOf(user.getId())))
                    .orElse(new TargetSnapshot("삭제된 회원", null, "DELETED", null, null));
        };
    }

    private String nicknameOf(Long userId) {
        if (userId == null) {
            return null;
        }
        return userProfileRepository.findByUserId(userId)
                .map(UserProfile::getNickname)
                .orElse(null);
    }

    private String preview(String text) {
        if (text == null) {
            return null;
        }
        String normalized = text.replaceAll("\\s+", " ").trim();
        return normalized.length() <= 120 ? normalized : normalized.substring(0, 120) + "...";
    }

    private record TargetSnapshot(
            String title,
            String preview,
            String status,
            Long authorId,
            String authorNickname
    ) {
    }

    private void recordAnalyticsEvent(String eventName, Long userId) {
        if (analyticsService != null) {
            analyticsService.recordBackendEvent(eventName, userId);
        }
    }
}
