package com.herfree.domain.auth.oauth;

import com.fasterxml.jackson.databind.JsonNode;
import com.herfree.domain.auth.entity.OAuthProvider;
import com.herfree.domain.auth.exception.OAuthAuthenticationFailedException;
import com.herfree.global.config.OAuthProperties;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class GoogleOAuthClient implements OAuthClient {

    private final OAuthProperties.Provider config;
    private final RestClient restClient;

    public GoogleOAuthClient(OAuthProperties properties) {
        this.config = properties.google();
        this.restClient = RestClient.create();
    }

    @Override
    public OAuthProvider provider() {
        return OAuthProvider.GOOGLE;
    }

    @Override
    public OAuthProviderProfile fetchProfile(String code, String redirectUri) {
        String accessToken = exchangeCode(code, redirectUri);
        return fetchUser(accessToken);
    }

    private String exchangeCode(String code, String redirectUri) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "authorization_code");
        form.add("client_id", config.clientId());
        form.add("client_secret", config.clientSecret());
        form.add("redirect_uri", redirectUri);
        form.add("code", code);

        try {
            JsonNode response = restClient.post()
                    .uri("https://oauth2.googleapis.com/token")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
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
                    .uri("https://www.googleapis.com/oauth2/v3/userinfo")
                    .header("Authorization", "Bearer " + accessToken)
                    .retrieve()
                    .body(JsonNode.class);
            if (response == null || !response.hasNonNull("sub")) {
                throw new OAuthAuthenticationFailedException();
            }

            return OAuthProviderProfile.of(
                    response.get("sub").asText(),
                    textOrNull(response, "email"),
                    textOrNull(response, "name"),
                    textOrNull(response, "picture")
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
