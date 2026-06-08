package com.herfree.domain.auth.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// 회원가입 요청 DTO
// Bean Validation 어노테이션으로 Controller 진입 전에 기본 형식 검증을 처리한다.
// 비즈니스 규칙(중복 이메일 등)은 Service에서 따로 검증한다.
public record SignupRequest(

        // 이메일 형식 검증 — @Email은 형식만 체크하므로
        // 도메인 존재 여부 같은 심화 검증은 별도 로직이 필요하다
        @NotBlank(message = "이메일을 입력해 주세요.")
        @Email(message = "올바른 이메일 형식이 아닙니다.")
        String email,

        // 최소 8자 — 너무 짧은 비밀번호는 BCrypt 해시 후에도 취약하다
        @NotBlank(message = "비밀번호를 입력해 주세요.")
        @Size(min = 8, message = "비밀번호는 최소 8자 이상이어야 합니다.")
        String password,

        // 닉네임 최대 20자 — DB 컬럼(50자)보다 작게 제한해 UI 표시 문제를 방지한다
        @NotBlank(message = "닉네임을 입력해 주세요.")
        @Size(max = 20, message = "닉네임은 최대 20자까지 입력할 수 있습니다.")
        String nickname
) {
}
