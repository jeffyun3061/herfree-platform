package com.herfree.domain.user.controller;

import com.herfree.domain.post.dto.response.PostResponse;
import com.herfree.domain.user.dto.request.UpdateProfileRequest;
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

    // 회원 탈퇴 — 물리 삭제 대신 status를 DELETED로 전환하는 soft delete 방식을 사용한다.
    // 작성 게시글·댓글 등 연관 데이터를 즉시 삭제하면 참조 무결성 오류가 생기고,
    // 운영 이슈 발생 시 복구가 불가능하다. 연관 데이터 익명화는 별도 배치로 처리한다.
    @DeleteMapping("/me")
    public ResponseEntity<ApiResponse<Void>> withdraw(
            @AuthenticationPrincipal Long userId
    ) {
        userService.withdraw(userId);
        return ResponseEntity.ok(ApiResponse.success("회원 탈퇴가 완료되었습니다.", null));
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

    // 내가 작성한 게시글 목록 — 본인 조회이므로 익명 글도 실제 닉네임으로 표시한다
    @GetMapping("/me/posts")
    public ResponseEntity<ApiResponse<Page<PostResponse>>> getMyPosts(
            @AuthenticationPrincipal Long userId,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.success(userService.getMyPosts(userId, pageable)));
    }
}
