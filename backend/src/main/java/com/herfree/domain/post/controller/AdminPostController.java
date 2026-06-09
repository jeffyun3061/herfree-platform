package com.herfree.domain.post.controller;

import com.herfree.domain.post.service.PostService;
import com.herfree.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// 게시글 관리자 API — SecurityConfig에서 /api/admin/** 경로는 ROLE_ADMIN 권한을 요구한다.
@RestController
@RequestMapping("/api/admin/posts")
@RequiredArgsConstructor
public class AdminPostController {

    private final PostService postService;

    // 관리자 게시글 숨김 처리 — 신고 수락 또는 직접 운영 조치 시 사용한다.
    @PatchMapping("/{postId}/hide")
    public ResponseEntity<ApiResponse<Void>> hidePost(@PathVariable Long postId) {
        postService.hidePost(postId);
        return ResponseEntity.ok(ApiResponse.success("게시글이 숨김 처리되었습니다.", null));
    }
}
