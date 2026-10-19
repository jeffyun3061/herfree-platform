package com.herfree.domain.auth.oauth;

import com.herfree.domain.auth.exception.OAuthAuthenticationFailedException;
import com.herfree.global.config.OAuthProperties;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class NaverOAuthClientTest {

    private static final String TOKEN_URL = "https://nid.naver.com/oauth2.0/token";

    @Test
    void exchangesCodeInFormBodyAndFetchesProfile() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        NaverOAuthClient client = new NaverOAuthClient(
                new OAuthProperties.Provider("client-id", "secret+with&special=chars", "https://example.com/callback"),
                builder.build());

        server.expect(requestTo(TOKEN_URL))
                .andExpect(method(HttpMethod.POST))
                .andExpect(content().contentType(MediaType.APPLICATION_FORM_URLENCODED))
                .andExpect(content().string(org.hamcrest.Matchers.containsString(
                        "client_secret=secret%2Bwith%26special%3Dchars")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("state=nonce")))
                .andRespond(withSuccess("{\"access_token\":\"provider-token\"}", MediaType.APPLICATION_JSON));
        server.expect(requestTo("https://openapi.naver.com/v1/nid/me"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess("{\"response\":{\"id\":\"naver-user\",\"email\":\"user@example.com\"}}",
                        MediaType.APPLICATION_JSON));

        OAuthProviderProfile profile = client.fetchProfile("authorization-code", "https://example.com/callback", "nonce");

        assertThat(profile.providerUserId()).isEqualTo("naver-user");
        server.verify();
    }

    @Test
    void rejectsProviderErrorWithoutServerException() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        NaverOAuthClient client = new NaverOAuthClient(
                new OAuthProperties.Provider("client-id", "client-secret", "https://example.com/callback"),
                builder.build());

        server.expect(requestTo(TOKEN_URL))
                .andRespond(withSuccess("{\"error\":\"invalid_grant\"}", MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> client.fetchProfile("invalid-code", "https://example.com/callback", "nonce"))
                .isInstanceOf(OAuthAuthenticationFailedException.class);
        server.verify();
    }
}
