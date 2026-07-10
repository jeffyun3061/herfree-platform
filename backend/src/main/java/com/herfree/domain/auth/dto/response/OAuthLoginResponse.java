package com.herfree.domain.auth.dto.response;

import com.herfree.domain.user.entity.UserRole;

public record OAuthLoginResponse(
        boolean needsProfile,
        String profileCompletionToken,
        String accessToken,
        String tokenType,
        Long expiresIn,
        Long userId,
        String nickname,
        UserRole role
) {
    public static OAuthLoginResponse completed(LoginResponse loginResponse) {
        return new OAuthLoginResponse(
                false,
                null,
                loginResponse.accessToken(),
                loginResponse.tokenType(),
                loginResponse.expiresIn(),
                loginResponse.userId(),
                loginResponse.nickname(),
                loginResponse.role()
        );
    }

    public static OAuthLoginResponse needsProfile(String profileCompletionToken, Long userId) {
        return new OAuthLoginResponse(
                true,
                profileCompletionToken,
                null,
                null,
                null,
                userId,
                null,
                null
        );
    }
}
