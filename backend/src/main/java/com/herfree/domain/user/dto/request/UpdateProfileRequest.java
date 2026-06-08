package com.herfree.domain.user.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 프로필 수정 요청 DTO
 * 닉네임과 자기소개만 수정 가능하며, 이메일·비밀번호 등 인증 정보는 별도 API로 분리한다.
 */
public record UpdateProfileRequest(

        // 닉네임은 필수값 — 공백 제출 방지
        @NotBlank(message = "닉네임을 입력해 주세요.")
        @Size(max = 20, message = "닉네임은 최대 20자까지 입력할 수 있습니다.")
        String nickname,

        // 자기소개는 선택값 — null 허용
        @Size(max = 200, message = "자기소개는 최대 200자까지 입력할 수 있습니다.")
        String bio

) {}
