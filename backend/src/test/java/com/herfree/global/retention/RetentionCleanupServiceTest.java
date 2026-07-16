package com.herfree.global.retention;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import com.herfree.domain.analytics.repository.AppEventLogRepository;
import com.herfree.domain.audit.repository.AdminAuditLogRepository;
import com.herfree.domain.auth.repository.PasswordResetTokenRepository;
import com.herfree.domain.user.repository.RoleAuditLogRepository;
import com.herfree.global.config.RetentionProperties;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class RetentionCleanupServiceTest {

    @Test
    void purgeExpiredDataUsesConfiguredRetentionPeriods() {
        AppEventLogRepository events = mock(AppEventLogRepository.class);
        PasswordResetTokenRepository resetTokens = mock(PasswordResetTokenRepository.class);
        AdminAuditLogRepository adminAudits = mock(AdminAuditLogRepository.class);
        RoleAuditLogRepository roleAudits = mock(RoleAuditLogRepository.class);
        given(events.deleteCreatedBefore(any())).willReturn(3);
        given(resetTokens.deleteExpiredBefore(any())).willReturn(2);
        given(adminAudits.deleteCreatedBefore(any())).willReturn(1);
        given(roleAudits.deleteCreatedBefore(any())).willReturn(4);
        RetentionCleanupService service = new RetentionCleanupService(
                new RetentionProperties(90, 7, 365, 365),
                events,
                resetTokens,
                adminAudits,
                roleAudits);

        Instant before = Instant.now();
        var result = service.purgeExpiredData();
        Instant after = Instant.now();

        assertThat(result.events()).isEqualTo(3);
        assertCutoff(events, before.minusSeconds(90L * 86400), after.minusSeconds(90L * 86400));
        verify(resetTokens).deleteExpiredBefore(any());
        verify(adminAudits).deleteCreatedBefore(any());
        verify(roleAudits).deleteCreatedBefore(any());
    }

    private void assertCutoff(
            AppEventLogRepository repository,
            Instant earliest,
            Instant latest
    ) {
        ArgumentCaptor<Instant> captor = ArgumentCaptor.forClass(Instant.class);
        verify(repository).deleteCreatedBefore(captor.capture());
        assertThat(captor.getValue()).isBetween(earliest, latest);
    }
}
