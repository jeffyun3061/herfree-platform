package com.herfree.domain.report.service;

import com.herfree.domain.comment.entity.Comment;
import com.herfree.domain.comment.exception.CommentNotFoundException;
import com.herfree.domain.comment.repository.CommentRepository;
import com.herfree.domain.post.entity.Post;
import com.herfree.domain.post.exception.PostNotFoundException;
import com.herfree.domain.post.repository.PostRepository;
import com.herfree.domain.report.dto.request.ModerationAction;
import com.herfree.domain.report.dto.request.ReportDecisionRequest;
import com.herfree.domain.report.dto.response.ReportResponse;
import com.herfree.domain.report.entity.ReportTargetType;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Atomic administrator workflow: moderation and report disposition succeed or roll back together. */
@Service
@RequiredArgsConstructor
public class ReportModerationFacade {

    private final ReportService reportService;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;

    @Transactional
    public ReportResponse decideReport(Long adminId, Long reportId, ReportDecisionRequest request) {
        ReportResponse processed = reportService.processReport(adminId, reportId, request.toProcessRequest());
        apply(processed.targetType(), processed.targetId(), request.moderationAction());
        return processed;
    }

    @Transactional
    public List<ReportResponse> decideTarget(
            Long adminId,
            ReportTargetType targetType,
            Long targetId,
            ReportDecisionRequest request
    ) {
        List<ReportResponse> processed =
                reportService.processTargetReports(adminId, targetType, targetId, request.toProcessRequest());
        apply(targetType, targetId, request.moderationAction());
        return processed;
    }

    private void apply(ReportTargetType targetType, Long targetId, ModerationAction action) {
        if (action == ModerationAction.NONE) return;
        switch (targetType) {
            case POST -> mutatePost(targetId, action);
            case COMMENT -> mutateComment(targetId, action);
            case USER -> throw new IllegalArgumentException("User sanctions require a separate reviewed workflow.");
        }
    }

    private void mutatePost(Long targetId, ModerationAction action) {
        Post post = postRepository.findById(targetId).orElseThrow(PostNotFoundException::new);
        if (action == ModerationAction.HIDE) post.hide();
        if (action == ModerationAction.DELETE) post.delete();
    }

    private void mutateComment(Long targetId, ModerationAction action) {
        Comment comment = commentRepository.findById(targetId).orElseThrow(CommentNotFoundException::new);
        if (action == ModerationAction.HIDE) comment.hide();
        if (action == ModerationAction.DELETE) comment.delete();
    }
}
