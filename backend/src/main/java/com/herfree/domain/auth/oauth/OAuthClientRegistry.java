package com.herfree.domain.auth.oauth;

import com.herfree.domain.auth.entity.OAuthProvider;
import com.herfree.domain.auth.exception.OAuthProviderNotConfiguredException;
import com.herfree.domain.auth.exception.OAuthRedirectUriMismatchException;
import com.herfree.global.config.OAuthProperties;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class OAuthClientRegistry {

    private final Map<OAuthProvider, OAuthClient> clients;
    private final OAuthProperties properties;

    public OAuthClientRegistry(List<OAuthClient> clientList, OAuthProperties properties) {
        this.properties = properties;
        this.clients = new EnumMap<>(OAuthProvider.class);
        for (OAuthClient client : clientList) {
            clients.put(client.provider(), client);
        }
    }

    public OAuthClient requireClient(OAuthProvider provider) {
        assertConfigured(provider);
        OAuthClient client = clients.get(provider);
        if (client == null) {
            throw new OAuthProviderNotConfiguredException();
        }
        return client;
    }

    public void assertConfigured(OAuthProvider provider) {
        if (!properties.isProviderConfigured(provider)) {
            throw new OAuthProviderNotConfiguredException();
        }
    }

    public void assertRedirectUri(OAuthProvider provider, String redirectUri) {
        // 콘솔, 프론트, 백엔드의 Callback URI가 다르면 외부 토큰 요청 전에 차단한다.
        if (!properties.isRedirectUriAllowed(provider, redirectUri)) {
            throw new OAuthRedirectUriMismatchException();
        }
    }
}
