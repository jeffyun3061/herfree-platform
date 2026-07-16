package com.herfree.domain.auth.dto.request;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record OAuthCompleteProfileRequest(
        @NotBlank String profileCompletionToken,
        @NotBlank @Size(min = 2, max = 20) String nickname,
        @AssertTrue(message = "이용약관에 동의해 주세요.") boolean agreeTerms,
        @AssertTrue(message = "개인정보처리방침에 동의해 주세요.") boolean agreePrivacy,
        @AssertTrue(message = "건강정보 등 민감정보 처리에 동의해 주세요.") boolean agreeSensitive,
        @AssertTrue(message = "만 14세 이상 확인이 필요합니다.") boolean agreeAge,
        boolean agreeMarketing,
        boolean agreeHealthStatistics
) {
}
