package com.herfree.global.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.herfree.domain.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

class JwtAuthenticationFilterTest {

    private static final String SECRET = "test-jwt-secret-minimum-32-characters!!";

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void profileCompletionTokenDoesNotAuthenticateProtectedRequest() throws Exception {
        JwtTokenProvider provider = new JwtTokenProvider(new JwtProperties(SECRET, 3600L));
        UserRepository userRepository = mock(UserRepository.class);
        JwtAuthenticationFilter filter =
                new JwtAuthenticationFilter(provider, userRepository, new ObjectMapper());
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/journal");
        request.addHeader("Authorization", "Bearer " + provider.createProfileCompletionToken("1"));
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        assertThat(chain.getRequest()).isNotNull();
        verifyNoInteractions(userRepository);
    }

    @Test
    void accessTokenWithNonNumericSubjectDoesNotCauseServerError() throws Exception {
        JwtTokenProvider provider = new JwtTokenProvider(new JwtProperties(SECRET, 3600L));
        UserRepository userRepository = mock(UserRepository.class);
        JwtAuthenticationFilter filter =
                new JwtAuthenticationFilter(provider, userRepository, new ObjectMapper());
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/journal");
        request.addHeader("Authorization", "Bearer " + provider.createAccessToken("not-a-user-id", "USER", 0));
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(200);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verifyNoInteractions(userRepository);
    }

    @Test
    void accessTokenIssuedBeforePasswordChangeIsRejected() throws Exception {
        JwtTokenProvider provider = new JwtTokenProvider(new JwtProperties(SECRET, 3600L));
        UserRepository userRepository = mock(UserRepository.class);
        com.herfree.domain.user.entity.User user = com.herfree.domain.user.entity.User.builder()
                .email("user@example.com")
                .password("encoded")
                .build();
        org.springframework.test.util.ReflectionTestUtils.setField(user, "id", 1L);
        user.changePassword("new-encoded");
        org.mockito.BDDMockito.given(userRepository.findById(1L)).willReturn(java.util.Optional.of(user));
        JwtAuthenticationFilter filter =
                new JwtAuthenticationFilter(provider, userRepository, new ObjectMapper());
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/users/me");
        request.addHeader("Authorization", "Bearer " + provider.createAccessToken("1", "USER", 0));
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        assertThat(response.getStatus()).isEqualTo(401);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }
}
