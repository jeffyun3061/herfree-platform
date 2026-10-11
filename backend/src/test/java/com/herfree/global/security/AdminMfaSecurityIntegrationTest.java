package com.herfree.global.security;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.mockito.Mockito.when;
import com.herfree.domain.auth.mfa.AdminMfaService;
import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.entity.UserRole;
import com.herfree.domain.user.repository.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = "app.admin.mfa.required=true")
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminMfaSecurityIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired JwtTokenProvider tokens;
    @MockitoBean UserRepository users;
    @MockitoBean AdminMfaService mfa;

    private String token(UserRole role) {
        User user = User.builder().email("admin-security@example.com").password("encoded").role(role).build();
        ReflectionTestUtils.setField(user, "id", 7L);
        when(users.findById(7L)).thenReturn(Optional.of(user));
        return tokens.createAccessToken("7", role.name(), user.getCredentialVersion());
    }

    @Test void realSecurityChainBlocksBearerWithoutMfa() throws Exception {
        mvc.perform(get("/api/admin/users").header("Authorization", "Bearer " + token(UserRole.ADMIN)))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("ADMIN_MFA_REQUIRED"));
    }
    @Test void mfaDoesNotGrantDoctorMemberManagementPrivileges() throws Exception {
        String access = token(UserRole.DOCTOR);
        when(mfa.verified(7L, access, "proof")).thenReturn(true);
        mvc.perform(get("/api/admin/users").header("Authorization", "Bearer " + access)
                .header("X-Herfree-Admin-MFA", "proof")).andExpect(status().isForbidden());
    }
    @Test void enrollmentAndVerificationRequirePrimaryAuthentication() throws Exception {
        mvc.perform(post("/api/auth/admin-mfa/enroll").contentType("application/json").content("{\"approvalCode\":\"ticket\"}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/admin-mfa/verify").contentType("application/json").content("{\"code\":\"123456\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test void developerNeedsMfaAndCannotUseOperatorApis() throws Exception {
        String access = token(UserRole.DEVELOPER);
        mvc.perform(get("/api/admin/developer/overview").header("Authorization", "Bearer " + access))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("ADMIN_MFA_REQUIRED"));
        when(mfa.verified(7L, access, "proof")).thenReturn(true);
        mvc.perform(get("/api/admin/developer/overview").header("Authorization", "Bearer " + access)
                .header("X-Herfree-Admin-MFA", "proof")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.database.state").value("UP"))
                .andExpect(jsonPath("$.data.database.password").doesNotExist())
                .andExpect(jsonPath("$.data.database.url").doesNotExist())
                .andExpect(jsonPath("$.data.host.state").value("UNAVAILABLE"));
        for (String path : java.util.List.of("/api/admin/users", "/api/admin/operator/tasks", "/api/admin/audit/actions", "/api/admin/stats/overview")) {
            mvc.perform(get(path).header("Authorization", "Bearer " + access).header("X-Herfree-Admin-MFA", "proof"))
                    .andExpect(status().isForbidden());
        }
    }

    @Test void operatorCannotReadDeveloperDiagnosticsAndAuditQueriesAreBounded() throws Exception {
        String access = token(UserRole.ADMIN);
        when(mfa.verified(7L, access, "proof")).thenReturn(true);
        mvc.perform(get("/api/admin/developer/requests").header("Authorization", "Bearer " + access)
                .header("X-Herfree-Admin-MFA", "proof")).andExpect(status().isForbidden());
        mvc.perform(get("/api/admin/operator/tasks").header("Authorization", "Bearer " + access)
                .header("X-Herfree-Admin-MFA", "proof")).andExpect(status().isOk());
        for (String query : java.util.List.of("?days=31", "?page=101", "?actorId=0", "?actorId=not-an-id")) {
            mvc.perform(get("/api/admin/audit/actions" + query).header("Authorization", "Bearer " + access)
                    .header("X-Herfree-Admin-MFA", "proof")).andExpect(status().isBadRequest());
        }
    }

    @Test void developerRequestSearchRejectsArbitraryQueries() throws Exception {
        String access = token(UserRole.DEVELOPER);
        when(mfa.verified(7L, access, "proof")).thenReturn(true);
        mvc.perform(get("/api/admin/developer/requests").param("requestId", "SELECT * FROM users")
                .header("Authorization", "Bearer " + access).header("X-Herfree-Admin-MFA", "proof"))
                .andExpect(status().isBadRequest());
    }
}
