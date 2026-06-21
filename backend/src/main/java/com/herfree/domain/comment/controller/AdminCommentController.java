package com.herfree.domain.comment.controller;

import com.herfree.domain.comment.dto.response.AdminCommunityCommentResponse;
import com.herfree.domain.comment.entity.CommentStatus;
import com.herfree.domain.comment.service.CommentService;
import com.herfree.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/comments")
@RequiredArgsConstructor
public class AdminCommentController {

    private final CommentService commentService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<AdminCommunityCommentResponse>>> getComments(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) CommentStatus status,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(commentService.getAdminComments(keyword, status, pageable)));
    }

    @PatchMapping("/{commentId}/hide")
    public ResponseEntity<ApiResponse<Void>> hideComment(@PathVariable Long commentId) {
        commentService.hideComment(commentId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PatchMapping("/{commentId}/restore")
    public ResponseEntity<ApiResponse<Void>> restoreComment(@PathVariable Long commentId) {
        commentService.restoreComment(commentId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
