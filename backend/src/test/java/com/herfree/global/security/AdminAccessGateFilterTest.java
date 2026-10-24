package com.herfree.global.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

import com.herfree.domain.auth.mfa.AdminMfaService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.junit.jupiter.api.AfterEach;
import static org.mockito.Mockito.when;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class AdminAccessGateFilterTest {
    @AfterEach void clearContext() { SecurityContextHolder.clearContext(); }

    private void authenticate() {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                7L, null, java.util.List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))));
    }

    @Test
    void administratorWithVerifiedSecondFactorContinues() throws Exception {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles("prod");
        AdminMfaService mfa = mock(AdminMfaService.class);
        when(mfa.verified(7L, "access", "mfa")).thenReturn(true);
        authenticate();
        AdminAccessGateFilter filter = new AdminAccessGateFilter(environment, mfa, new ObjectMapper());
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/admin/users");
        request.setRemoteAddr("10.20.3.4");
        request.addHeader("Authorization", "Bearer access");
        request.addHeader("X-Herfree-Admin-MFA", "mfa");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        verify(chain).doFilter(request, response);
        assertThat(response.getStatus()).isEqualTo(200);
    }

    @Test
    void bearerTokenWithoutSecondFactorIsForbiddenEvenOnAllowedNetwork() throws Exception {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles("prod");
        authenticate();
        AdminAccessGateFilter filter = new AdminAccessGateFilter(environment, mock(AdminMfaService.class), new ObjectMapper());
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/admin/users");
        request.setRemoteAddr("10.20.3.4");
        request.addHeader("Authorization", "Bearer stolen-access");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(403);
        assertThat(response.getContentAsString()).contains("ADMIN_MFA_REQUIRED");
        verifyNoInteractions(chain);
    }
}
