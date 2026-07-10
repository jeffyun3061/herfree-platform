package com.herfree.domain.auth.oauth;

import com.herfree.domain.auth.entity.OAuthProvider;

public record OAuthProviderProfile(
        String providerUserId,
        String email,
        String nickname,
        String profileImageUrl
) {
    public static OAuthProviderProfile of(
            String providerUserId,
            String email,
            String nickname,
            String profileImageUrl
    ) {
        return new OAuthProviderProfile(
                providerUserId,
                blankToNull(email),
                blankToNull(nickname),
                blankToNull(profileImageUrl)
        );
    }

    public String resolveEmail(OAuthProvider provider) {
        if (email != null) {
            return email.trim().toLowerCase();
        }
        return provider.pathValue() + "_" + providerUserId + "@oauth.herfree.local";
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
