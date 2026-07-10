package com.herfree.domain.auth.oauth;

import com.herfree.domain.auth.entity.OAuthProvider;
import com.herfree.domain.auth.exception.OAuthProviderNotConfiguredException;
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
        OAuthProperties.Provider config = switch (provider) {
            case KAKAO -> properties.kakao();
            case GOOGLE -> properties.google();
            case NAVER -> properties.naver();
        };
        if (config == null || !config.isConfigured()) {
            throw new OAuthProviderNotConfiguredException();
        }
    }
}
