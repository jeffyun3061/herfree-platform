package com.herfree.domain.auth.dto.request;

import jakarta.validation.constraints.NotBlank;

// 로그인 요청 DTO
// 로그인 단계에서는 이메일 형식 검증(@Email)을 걸지 않는다.
// 어차피 DB에 없으면 인증 실패로 처리되며, 형식 오류 메시지로 계정 존재 여부를 추론하게 두지 않는 것이 보안상 좋다.
public record LoginRequest(

        @NotBlank(message = "이메일을 입력해 주세요.")
        String email,

        @NotBlank(message = "비밀번호를 입력해 주세요.")
        String password
) {
}
