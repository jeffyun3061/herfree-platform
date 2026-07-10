package com.herfree.domain.auth.oauth;

import com.fasterxml.jackson.databind.JsonNode;
import com.herfree.domain.auth.entity.OAuthProvider;
import com.herfree.domain.auth.exception.OAuthAuthenticationFailedException;
import com.herfree.global.config.OAuthProperties;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class KakaoOAuthClient implements OAuthClient {

    private final OAuthProperties.Provider config;
    private final RestClient restClient;

    public KakaoOAuthClient(OAuthProperties properties) {
        this.config = properties.kakao();
        this.restClient = RestClient.create();
    }

    @Override
    public OAuthProvider provider() {
        return OAuthProvider.KAKAO;
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
        if (StringUtils.hasText(config.clientSecret())) {
            form.add("client_secret", config.clientSecret());
        }
        form.add("redirect_uri", redirectUri);
        form.add("code", code);

        try {
            JsonNode response = restClient.post()
                    .uri("https://kauth.kakao.com/oauth/token")
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
                    .uri("https://kapi.kakao.com/v2/user/me")
                    .header("Authorization", "Bearer " + accessToken)
                    .retrieve()
                    .body(JsonNode.class);
            if (response == null || !response.hasNonNull("id")) {
                throw new OAuthAuthenticationFailedException();
            }

            String providerUserId = response.get("id").asText();
            JsonNode account = response.path("kakao_account");
            String email = textOrNull(account, "email");
            JsonNode profile = account.path("profile");
            String nickname = textOrNull(profile, "nickname");
            String image = textOrNull(profile, "profile_image_url");

            return OAuthProviderProfile.of(providerUserId, email, nickname, image);
        } catch (RestClientException ex) {
            throw new OAuthAuthenticationFailedException();
        }
    }

    private String textOrNull(JsonNode node, String field) {
        if (node == null || node.isMissingNode() || !node.hasNonNull(field)) {
            return null;
        }
        String value = node.get(field).asText();
        return value == null || value.isBlank() ? null : value;
    }
}
