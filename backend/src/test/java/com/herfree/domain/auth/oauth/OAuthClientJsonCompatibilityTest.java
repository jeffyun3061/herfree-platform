package com.herfree.domain.auth.oauth;

import com.herfree.global.config.OAuthProperties;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class OAuthClientJsonCompatibilityTest {
    @Test
    void kakaoTokenAndUserResponsesDeserializeUnderBootFour() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        KakaoOAuthClient client = new KakaoOAuthClient(
                new OAuthProperties.Provider("client-id", "client-secret", "https://example.com/callback"), builder.build());
        server.expect(requestTo("https://kauth.kakao.com/oauth/token"))
                .andRespond(withSuccess("{\"access_token\":\"provider-token\"}", MediaType.APPLICATION_JSON));
        server.expect(requestTo("https://kapi.kakao.com/v2/user/me"))
                .andRespond(withSuccess("{\"id\":12345,\"kakao_account\":{\"email\":\"user@example.com\",\"profile\":{\"nickname\":\"tester\"}}}",
                        MediaType.APPLICATION_JSON));
        OAuthProviderProfile profile = client.fetchProfile("authorization-code", "https://example.com/callback", "nonce");
        assertThat(profile.providerUserId()).isEqualTo("12345");
        assertThat(profile.email()).isEqualTo("user@example.com");
        server.verify();
    }

    @Test
    void googleTokenAndUserResponsesDeserializeUnderBootFour() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        GoogleOAuthClient client = new GoogleOAuthClient(
                new OAuthProperties.Provider("client-id", "client-secret", "https://example.com/callback"), builder.build());
        server.expect(requestTo("https://oauth2.googleapis.com/token"))
                .andRespond(withSuccess("{\"access_token\":\"provider-token\"}", MediaType.APPLICATION_JSON));
        server.expect(requestTo("https://www.googleapis.com/oauth2/v3/userinfo"))
                .andRespond(withSuccess("{\"sub\":\"google-user\",\"email\":\"user@example.com\",\"name\":\"tester\"}",
                        MediaType.APPLICATION_JSON));
        OAuthProviderProfile profile = client.fetchProfile("authorization-code", "https://example.com/callback", "nonce");
        assertThat(profile.providerUserId()).isEqualTo("google-user");
        assertThat(profile.email()).isEqualTo("user@example.com");
        server.verify();
    }
}
