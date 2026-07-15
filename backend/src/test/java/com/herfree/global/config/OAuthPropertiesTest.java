package com.herfree.global.config;

import static org.assertj.core.api.Assertions.assertThat;

import com.herfree.domain.auth.entity.OAuthProvider;
import org.junit.jupiter.api.Test;

class OAuthPropertiesTest {

    @Test
    void redirectUriMustMatchExactly() {
        OAuthProperties.Provider kakao = new OAuthProperties.Provider(
                "kakao-client",
                "",
                "http://localhost:3000/auth/callback/kakao"
        );
        OAuthProperties.Provider google = new OAuthProperties.Provider(
                "google-client",
                "google-secret",
                "http://localhost:3000/auth/callback/google"
        );
        OAuthProperties.Provider naver = new OAuthProperties.Provider(
                "naver-client",
                "naver-secret",
                "http://localhost:3000/auth/callback/naver"
        );
        OAuthProperties properties = new OAuthProperties(kakao, google, naver);

        assertThat(properties.isRedirectUriAllowed(
                OAuthProvider.NAVER,
                "http://localhost:3000/auth/callback/naver"
        )).isTrue();
        assertThat(properties.isRedirectUriAllowed(
                OAuthProvider.NAVER,
                "http://127.0.0.1:3000/auth/callback/naver"
        )).isFalse();
    }
}
