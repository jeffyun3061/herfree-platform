package com.herfree.domain.auth.oauth;

import tools.jackson.databind.JsonNode;
import com.herfree.domain.auth.entity.OAuthProvider;
import com.herfree.domain.auth.exception.OAuthAuthenticationFailedException;
import com.herfree.global.config.OAuthProperties;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class NaverOAuthClient implements OAuthClient {

    private final OAuthProperties.Provider config;
    private final RestClient restClient;

    @Autowired
    public NaverOAuthClient(OAuthProperties properties) {
        this(properties.naver(), RestClient.create());
    }

    NaverOAuthClient(OAuthProperties.Provider config, RestClient restClient) {
        this.config = config;
        this.restClient = restClient;
    }

    @Override
    public OAuthProvider provider() {
        return OAuthProvider.NAVER;
    }

    @Override
    public OAuthProviderProfile fetchProfile(String code, String redirectUri, String state) {
        String accessToken = exchangeCode(code, redirectUri, state);
        return fetchUser(accessToken);
    }

    private String exchangeCode(String code, String redirectUri, String state) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "authorization_code");
        form.add("client_id", config.clientId());
        form.add("client_secret", config.clientSecret());
        form.add("redirect_uri", redirectUri);
        form.add("code", code);
        form.add("state", state);

        try {
            JsonNode response = restClient.post()
                    .uri("https://nid.naver.com/oauth2.0/token")
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
