package com.herfree.global.security;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.herfree.global.config.ForwardedHeaderProperties;
import com.herfree.global.util.ClientIpExtractor;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import java.io.IOException;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.util.ReflectionTestUtils;

class AuthRateLimitFilterTest {

    @Test
    void rejectsAfterTwentyAttemptsAndProvidesRetryHint() throws Exception {
        TestableFilter filter = new TestableFilter();
        ReflectionTestUtils.setField(filter, "rateLimitEnabled", true);

        MockHttpServletResponse lastResponse = null;
        for (int attempt = 1; attempt <= 21; attempt++) {
            MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login");
            request.setRemoteAddr("198.51.100.10");
            lastResponse = new MockHttpServletResponse();
            filter.invoke(request, lastResponse, new NoopFilterChain());
            if (attempt <= 20) {
                assertThat(lastResponse.getStatus()).isEqualTo(200);
            }
        }

        assertThat(lastResponse).isNotNull();
        assertThat(lastResponse.getStatus()).isEqualTo(429);
        assertThat(lastResponse.getHeader("Retry-After")).isEqualTo("60");
    }

    private static final class TestableFilter extends AuthRateLimitFilter {

        private TestableFilter() {
            super(new ObjectMapper(), new ClientIpExtractor(new ForwardedHeaderProperties("127.0.0.1/32")));
        }

        private void invoke(
                MockHttpServletRequest request,
                MockHttpServletResponse response,
                FilterChain chain
        ) throws ServletException, IOException {
            doFilterInternal(request, response, chain);
        }
    }

    private static final class NoopFilterChain implements FilterChain {
        @Override
        public void doFilter(jakarta.servlet.ServletRequest request, jakarta.servlet.ServletResponse response) {
            ((MockHttpServletResponse) response).setStatus(200);
        }
    }
}
