package com.herfree.domain.comment.controller;

import com.herfree.domain.comment.dto.request.CommentCreateRequest;
import com.herfree.domain.comment.dto.response.CommentResponse;
import com.herfree.domain.comment.service.CommentService;
import com.herfree.global.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    // 댓글 목록 조회 — posts/{postId}/comments 경로는 게시글-댓글 계층 관계를 URL로 표현한다
    @GetMapping("/api/posts/{postId}/comments")
    public ResponseEntity<ApiResponse<Page<CommentResponse>>> getComments(
            @PathVariable Long postId,
            @AuthenticationPrincipal Long userId,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.success(commentService.getComments(postId, userId, pageable)));
    }

    @PostMapping("/api/posts/{postId}/comments")
    public ResponseEntity<ApiResponse<CommentResponse>> createComment(
            @PathVariable Long postId,
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody CommentCreateRequest request
    ) {
        CommentResponse response = commentService.createComment(postId, userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    // 댓글 삭제는 /api/comments/{commentId} 경로 — 게시글 ID 없이 댓글 ID만으로 식별 가능하다
    @DeleteMapping("/api/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable Long commentId,
            @AuthenticationPrincipal Long userId
    ) {
        commentService.deleteComment(commentId, userId);
        return ResponseEntity.noContent().build();
    }
}
