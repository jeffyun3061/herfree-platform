package com.herfree.domain.auth.controller;

import com.herfree.domain.auth.dto.request.LoginRequest;
import com.herfree.domain.auth.dto.request.SignupRequest;
import com.herfree.domain.auth.dto.response.LoginResponse;
import com.herfree.domain.auth.service.AuthService;
import com.herfree.global.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// 인증 관련 엔드포인트 — SecurityConfig에서 /api/auth/** 경로 전체를 permitAll로 열어둔다.
// 인증이 필요 없는 회원가입·로그인은 JWT 필터를 타지 않는다.
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // 회원가입 — 성공 시 201 Created를 반환한다.
    // 200 OK가 아닌 201을 쓰는 이유: HTTP 시맨틱에서 201은 "새 리소스가 생성됐음"을 명확히 표현한다.
    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<Void>> signup(@Valid @RequestBody SignupRequest request) {
        authService.signup(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("회원가입이 완료됐습니다.", null));
    }

    // 로그인 — JWT accessToken을 응답에 포함한다.
    // 토큰을 HttpOnly 쿠키에 담지 않고 Body로 내려주는 이유:
    // 모바일 앱과 웹 클라이언트 모두 동일한 방식으로 처리하기 위함이다.
    // (HttpOnly 쿠키는 native 앱에서 처리하기 번거롭다)
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // 로그아웃 — 1차 MVP는 서버에서 상태를 관리하지 않는 Stateless 구조이므로
    // 실제 토큰 무효화는 클라이언트가 저장된 토큰을 삭제하는 방식으로 처리한다.
    // 추후 Redis Blacklist 방식의 토큰 블랙리스트를 도입할 경우 이 엔드포인트에 로직을 추가한다.
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout() {
        return ResponseEntity.ok(ApiResponse.success("로그아웃되었습니다.", null));
    }
}
