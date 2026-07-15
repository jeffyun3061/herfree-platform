package com.herfree.global.config;

import com.herfree.domain.auth.entity.OAuthProvider;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.StringUtils;

@ConfigurationProperties(prefix = "app.oauth")
public record OAuthProperties(
        Provider kakao,
        Provider google,
        Provider naver
) {
    public record Provider(
            String clientId,
            String clientSecret,
            String redirectUri
    ) {
        /** @deprecated provider별 검증은 {@link #isProviderConfigured(OAuthProvider)} 사용 */
        @Deprecated
        public boolean isConfigured() {
            return StringUtils.hasText(clientId)
                    && StringUtils.hasText(clientSecret)
                    && StringUtils.hasText(redirectUri);
        }
    }

    public boolean isProviderConfigured(OAuthProvider provider) {
        Provider config = providerConfig(provider);
        if (config == null || !StringUtils.hasText(config.clientId()) || !StringUtils.hasText(config.redirectUri())) {
            return false;
        }
        if (provider == OAuthProvider.KAKAO) {
            return true;
        }
        return StringUtils.hasText(config.clientSecret());
    }

    public boolean isRedirectUriAllowed(OAuthProvider provider, String redirectUri) {
        Provider config = providerConfig(provider);
        return config != null
                && StringUtils.hasText(config.redirectUri())
                && config.redirectUri().equals(redirectUri);
    }

    private Provider providerConfig(OAuthProvider provider) {
        return switch (provider) {
            case KAKAO -> kakao;
            case GOOGLE -> google;
            case NAVER -> naver;
        };
    }
}
