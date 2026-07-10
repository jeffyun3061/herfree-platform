package com.herfree.domain.auth.oauth;

import com.fasterxml.jackson.databind.JsonNode;
import com.herfree.domain.auth.entity.OAuthProvider;
import com.herfree.domain.auth.exception.OAuthAuthenticationFailedException;
import com.herfree.global.config.OAuthProperties;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.util.UriComponentsBuilder;

@Component
public class NaverOAuthClient implements OAuthClient {

    private final OAuthProperties.Provider config;
    private final RestClient restClient;

    public NaverOAuthClient(OAuthProperties properties) {
        this.config = properties.naver();
        this.restClient = RestClient.create();
    }

    @Override
    public OAuthProvider provider() {
        return OAuthProvider.NAVER;
    }

    @Override
    public OAuthProviderProfile fetchProfile(String code, String redirectUri) {
        String accessToken = exchangeCode(code, redirectUri);
        return fetchUser(accessToken);
    }

    private String exchangeCode(String code, String redirectUri) {
        String tokenUri = UriComponentsBuilder
                .fromUriString("https://nid.naver.com/oauth2.0/token")
                .queryParam("grant_type", "authorization_code")
                .queryParam("client_id", config.clientId())
                .queryParam("client_secret", config.clientSecret())
                .queryParam("redirect_uri", redirectUri)
                .queryParam("code", code)
                .queryParam("state", "herfree")
                .build()
                .toUriString();

        try {
            JsonNode response = restClient.get()
                    .uri(tokenUri)
                    .retrieve()
                    .body(JsonNode.class);
            if (response == null || !response.hasNonNull("access_token")) {
                throw new OAuthAuthenticationFailedException();
            }
            return response.get("access_token").asText();
        } catch (RestClientException ex) {
            throw new OAuthAuthenticationFailedException();
        }
    }

    private OAuthProviderProfile fetchUser(String accessToken) {
        try {
            JsonNode response = restClient.get()
                    .uri("https://openapi.naver.com/v1/nid/me")
                    .header("Authorization", "Bearer " + accessToken)
                    .retrieve()
                    .body(JsonNode.class);
            if (response == null || response.path("response").isMissingNode()) {
                throw new OAuthAuthenticationFailedException();
            }

            JsonNode profile = response.get("response");
            if (!profile.hasNonNull("id")) {
                throw new OAuthAuthenticationFailedException();
            }

            return OAuthProviderProfile.of(
                    profile.get("id").asText(),
                    textOrNull(profile, "email"),
                    textOrNull(profile, "nickname"),
                    textOrNull(profile, "profile_image")
            );
        } catch (RestClientException ex) {
            throw new OAuthAuthenticationFailedException();
        }
    }

    private String textOrNull(JsonNode node, String field) {
        if (node == null || !node.hasNonNull(field)) {
            return null;
        }
        String value = node.get(field).asText();
        return value == null || value.isBlank() ? null : value;
    }
}
