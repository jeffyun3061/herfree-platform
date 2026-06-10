package com.herfree.domain.comment.controller;

import com.herfree.domain.comment.service.CommentService;
import com.herfree.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// 관리자 전용 댓글 관리 API
@RestController
@RequestMapping("/api/admin/comments")
@RequiredArgsConstructor
public class AdminCommentController {

    private final CommentService commentService;

    @PatchMapping("/{commentId}/hide")
    public ResponseEntity<ApiResponse<Void>> hideComment(@PathVariable Long commentId) {
        commentService.hideComment(commentId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
