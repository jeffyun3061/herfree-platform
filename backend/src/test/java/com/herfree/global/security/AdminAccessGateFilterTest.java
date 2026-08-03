package com.herfree.global.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

import com.herfree.global.config.AdminAccessProperties;
import com.herfree.global.config.ForwardedHeaderProperties;
import com.herfree.global.util.ClientIpExtractor;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class AdminAccessGateFilterTest {

    @Test
    void publicAdminRequestFromAllowedCidrContinues() throws Exception {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles("prod");
        AdminAccessGateFilter filter = new AdminAccessGateFilter(
                environment,
                new AdminAccessProperties("10.20.0.0/16"),
                new ClientIpExtractor(new ForwardedHeaderProperties("127.0.0.1/32")));
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/admin/users");
        request.setRemoteAddr("10.20.3.4");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        verify(chain).doFilter(request, response);
        assertThat(response.getStatus()).isEqualTo(200);
    }

    @Test
    void publicAdminRequestOutsideAllowedCidrIsForbidden() throws Exception {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles("prod");
        AdminAccessGateFilter filter = new AdminAccessGateFilter(
                environment,
                new AdminAccessProperties("10.20.0.0/16"),
                new ClientIpExtractor(new ForwardedHeaderProperties("127.0.0.1/32")));
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/admin/users");
        request.setRemoteAddr("203.0.113.4");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(403);
        verifyNoInteractions(chain);
    }
}
