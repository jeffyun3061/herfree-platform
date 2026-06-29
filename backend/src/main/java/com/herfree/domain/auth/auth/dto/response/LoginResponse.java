package com.herfree.domain.auth.dto.response;

import com.herfree.domain.user.entity.UserRole;

// 로그인 성공 응답 DTO
// 클라이언트가 이후 API를 호출하는 데 필요한 최소한의 정보만 포함한다.
// 이메일·비밀번호는 응답에 절대 포함하지 않는다.
public record LoginResponse(

        // 클라이언트가 Authorization 헤더에 담아 보낼 JWT
        String accessToken,

        // Bearer 타입 고정 — 클라이언트가 헤더를 조립할 때 이 값을 그대로 사용한다
        String tokenType,

        // 토큰 만료까지 남은 초 — 클라이언트가 자동 재로그인 타이머를 설정할 때 사용
        long expiresIn,

        // 이후 /api/users/me 같은 요청에서 userId를 이미 알고 있도록 응답에 포함
        Long userId,

        // 로그인 직후 UI에 닉네임을 표시하기 위해 포함
        String nickname,

        // 권한에 따라 관리자 메뉴를 노출할지 결정하는 클라이언트 분기에 사용
        UserRole role
) {
}
