package com.herfree.domain.user.controller;

import com.herfree.domain.post.dto.response.PostResponse;
import com.herfree.domain.user.dto.request.UpdateProfileRequest;
import com.herfree.domain.user.dto.response.UserActivityResponse;
import com.herfree.domain.user.dto.response.UserResponse;
import com.herfree.domain.user.service.UserService;
import com.herfree.global.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

// 내 정보 관련 API — 인증된 사용자 전용 엔드포인트
// /api/users/me 경로는 "현재 로그인한 사용자의 리소스"를 나타내는 관용적 패턴이다.
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // 내 정보 조회 — JWT에서 추출한 userId를 @AuthenticationPrincipal로 받는다.
    // Principal 객체에서 userId를 꺼내는 방식이므로 헤더를 직접 파싱하지 않아도 된다.
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getMyInfo(
            @AuthenticationPrincipal Long userId
    ) {
        UserResponse response = userService.getMyInfo(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // 프로필 수정 — PATCH는 일부 필드만 변경할 때 사용하는 HTTP 메서드다.
    // PUT은 전체 리소스 교체를 의미하므로 프로필 수정에는 PATCH가 더 적합하다.
    @PatchMapping("/me/profile")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        UserResponse response = userService.updateProfile(userId, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // 회원 탈퇴 — api-spec.md §8.2, 204 No Content 반환
    // 클라이언트는 성공 후 localStorage 토큰을 반드시 폐기해야 한다.
    @DeleteMapping("/me")
    public ResponseEntity<Void> withdraw(@AuthenticationPrincipal Long userId) {
        userService.withdraw(userId);
        return ResponseEntity.noContent().build();
    }

    // 마이페이지 활동 요약 — 작성 글·증상 기록·받은 공감 집계
    @GetMapping("/me/activity")
    public ResponseEntity<ApiResponse<UserActivityResponse>> getMyActivity(
            @AuthenticationPrincipal Long userId
    ) {
        return ResponseEntity.ok(ApiResponse.success(userService.getMyActivity(userId)));
    }

    // 내가 작성한 게시글 목록 — boardId로 게시판별 필터 가능
    @GetMapping("/me/posts")
    public ResponseEntity<ApiResponse<Page<PostResponse>>> getMyPosts(
            @AuthenticationPrincipal Long userId,
            @RequestParam(required = false) Long boardId,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.success(userService.getMyPosts(userId, boardId, pageable)));
    }
}
