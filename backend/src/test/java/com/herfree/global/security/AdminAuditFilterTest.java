package com.herfree.global.security;

import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.herfree.domain.audit.service.AdminAuditService;
import com.herfree.global.web.RequestCorrelationFilter;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

@ExtendWith(MockitoExtension.class)
class AdminAuditFilterTest {

    @Mock
    private AdminAuditService adminAuditService;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void recordsAuthenticatedAdminMutationWithoutBodyOrQuery() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(
                UsernamePasswordAuthenticationToken.authenticated(42L, null, java.util.List.of()));
        MockHttpServletRequest request = new MockHttpServletRequest(
                "PATCH", "/api/admin/users/7/status");
        request.setQueryString("reason=must-not-be-stored");
        request.setAttribute(RequestCorrelationFilter.ATTRIBUTE, "request-123");
        MockHttpServletResponse response = new MockHttpServletResponse();

        new AdminAuditFilter(adminAuditService, new SimpleMeterRegistry())
                .doFilter(request, response, (req, res) -> response.setStatus(204));

        verify(adminAuditService).record(
                42L, "PATCH", "/api/admin/users/7/status", 204, "request-123");
    }

    @Test
    void ignoresReadOnlyAdminRequests() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/admin/users");
        MockHttpServletResponse response = new MockHttpServletResponse();

        new AdminAuditFilter(adminAuditService, new SimpleMeterRegistry())
                .doFilter(request, response, (req, res) -> { });

        verify(adminAuditService, never()).record(
                org.mockito.ArgumentMatchers.anyLong(),
                org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.anyInt(),
                org.mockito.ArgumentMatchers.anyString());
    }
}
