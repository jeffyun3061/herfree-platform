package com.herfree.domain.operations;

import static org.assertj.core.api.Assertions.assertThat;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.herfree.domain.auth.mfa.AdminMfaService;
import com.herfree.domain.user.entity.UserRole;
import com.herfree.global.util.StaffRolePolicy;
import com.herfree.global.web.RequestCorrelationFilter;
import com.herfree.global.web.RequestDiagnosticsFilter;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.web.servlet.HandlerMapping;

class OperationsPrivacyTest {
    @TempDir Path directory;

    @Test void developerHasMfaButNoMemberOrPrivateBoardPrivileges() {
        assertThat(AdminMfaService.canUseAdminApi(UserRole.DEVELOPER)).isTrue();
        assertThat(StaffRolePolicy.resolveAuthorities(UserRole.DEVELOPER)).containsExactly("ROLE_DEVELOPER", "ROLE_USER");
        assertThat(StaffRolePolicy.isStaff(UserRole.DEVELOPER)).isFalse();
        assertThat(StaffRolePolicy.canManageMemberStatus(UserRole.DEVELOPER)).isFalse();
        assertThat(StaffRolePolicy.canChangeRole(UserRole.DEVELOPER)).isFalse();
    }

    @Test void requestDiagnosticsNeverStoreRawUrlsBodiesOrHeadersAndAreBounded() throws Exception {
        var store = new RequestDiagnostics();
        var filter = new RequestDiagnosticsFilter(store);
        var request = new MockHttpServletRequest("GET", "/api/posts/123/private-memo");
        request.setQueryString("email=private@example.test");
        request.setContent("health-memo-must-not-leak".getBytes(java.nio.charset.StandardCharsets.UTF_8));
        request.addHeader("Authorization", "Bearer must-not-leak");
        request.setAttribute(RequestCorrelationFilter.ATTRIBUTE, "safe-id");
        request.setAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE, "/api/posts/{postId}");
        filter.doFilter(request, new MockHttpServletResponse(), (req, res) -> ((jakarta.servlet.http.HttpServletResponse) res).setStatus(500));
        var entry = store.snapshot(true, "safe-id").entries().get(0);
        assertThat(entry.route()).isEqualTo("/api/posts/{postId}");
        assertThat(entry.route()).doesNotContain("123");
        // Timestamp and duration are allowed to contain these digits by chance.
        assertThat(entry.toString()).doesNotContain("private-memo", "private@example", "health-memo", "must-not-leak");
        for (int i = 0; i < 1010; i++) store.record("id-" + i, "GET", "/api/health", 200, 1);
        assertThat(store.snapshot(false, null).retainedCount()).isEqualTo(1000);
        assertThat(store.snapshot(false, null).entries()).hasSize(50);
        assertThat(store.snapshot(true, "safe-id").entries()).isEmpty();
    }

    @Test void staleForeignMalformedAndMissingHostSnapshotsNeverAppearFresh() throws Exception {
        Path file = directory.resolve("status.json");
        var reader = new HostOperationsSnapshot(new ObjectMapper(), file.toString(), "production");
        assertThat(reader.read().state()).isEqualTo("UNAVAILABLE");
        Files.writeString(file, "{\"environment\":\"staging\",\"collectedAt\":\"" + Instant.now() + "\"}");
        assertThat(reader.read().state()).isEqualTo("UNAVAILABLE");
        Files.writeString(file, "{\"environment\":\"production\",\"collectedAt\":\"" + Instant.now().minusSeconds(601) + "\",\"memoryPercent\":50,\"secret\":\"ignored\"}");
        assertThat(reader.read().state()).isEqualTo("STALE");
        Files.writeString(file, "{\"environment\":\"production\",\"collectedAt\":\"" + Instant.now() + "\",\"memoryPercent\":101,\"httpsHealthy\":\"true\"}");
        assertThat(reader.read().state()).isEqualTo("FRESH");
        assertThat(reader.read().memoryPercent()).isNull();
        assertThat(reader.read().httpsHealthy()).isNull();
        Files.writeString(file, "invalid json");
        assertThat(reader.read().state()).isEqualTo("UNAVAILABLE");
    }
}
