package com.herfree.global.retention;

import com.herfree.domain.analytics.repository.AppEventLogRepository;
import com.herfree.domain.audit.repository.AdminAuditLogRepository;
import com.herfree.domain.auth.repository.PasswordResetTokenRepository;
import com.herfree.domain.user.repository.RoleAuditLogRepository;
import com.herfree.global.config.RetentionProperties;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class RetentionCleanupService {

    private final RetentionProperties properties;
    private final AppEventLogRepository appEventLogRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final AdminAuditLogRepository adminAuditLogRepository;
    private final RoleAuditLogRepository roleAuditLogRepository;

    @Scheduled(
            cron = "${app.retention.cleanup-cron:0 20 3 * * *}",
            zone = "Asia/Seoul"
    )
    @Transactional
    public CleanupResult purgeExpiredData() {
        Instant now = Instant.now();
        CleanupResult result = new CleanupResult(
                appEventLogRepository.deleteCreatedBefore(
                        now.minus(properties.eventDays(), ChronoUnit.DAYS)),
                passwordResetTokenRepository.deleteExpiredBefore(
                        now.minus(properties.resetTokenGraceDays(), ChronoUnit.DAYS)),
                adminAuditLogRepository.deleteCreatedBefore(
                        now.minus(properties.adminAuditDays(), ChronoUnit.DAYS)),
                roleAuditLogRepository.deleteCreatedBefore(
                        now.minus(properties.roleAuditDays(), ChronoUnit.DAYS))
        );
        log.info(
                "Retention cleanup completed (events={}, resetTokens={}, adminAudits={}, roleAudits={})",
                result.events(),
                result.resetTokens(),
                result.adminAudits(),
                result.roleAudits());
        return result;
    }

    public record CleanupResult(
            int events,
            int resetTokens,
            int adminAudits,
            int roleAudits
    ) {
    }
}
