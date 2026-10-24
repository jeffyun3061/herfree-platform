package com.herfree.domain.auth.mfa;

import com.herfree.domain.user.entity.*;
import com.herfree.domain.user.repository.UserRepository;
import com.herfree.global.exception.BusinessException;
import java.sql.Timestamp;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import org.junit.jupiter.api.*;
import org.springframework.aop.framework.ProxyFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.transaction.annotation.AnnotationTransactionAttributeSource;
import org.springframework.transaction.interceptor.TransactionInterceptor;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class AdminMfaServiceTest {
    private AdminMfaService service;
    private JdbcTemplate jdbc;
    private User actor;
    private MfaCrypto crypto;
    private MutableClock clock;

    @BeforeEach void prepare() {
        DriverManagerDataSource ds = new DriverManagerDataSource("jdbc:h2:mem:" + UUID.randomUUID()
                + ";MODE=MySQL;DB_CLOSE_DELAY=-1", "sa", "");
        jdbc = new JdbcTemplate(ds);
        jdbc.execute("CREATE TABLE users(id BIGINT PRIMARY KEY)");
        jdbc.update("INSERT INTO users(id) VALUES (7)");
        new ResourceDatabasePopulator(new ClassPathResource("db/migration/V44__create_admin_mfa.sql")).execute(ds);
        UserRepository users = mock(UserRepository.class);
        actor = mock(User.class);
        when(actor.getId()).thenReturn(7L);
        when(actor.getRole()).thenReturn(UserRole.ADMIN);
        when(actor.getCredentialVersion()).thenReturn(0);
        when(users.findByIdAndStatus(7L, UserStatus.ACTIVE)).thenReturn(Optional.of(actor));
        when(users.findByIdAndStatusForUpdate(7L, UserStatus.ACTIVE)).thenReturn(Optional.of(actor));
        crypto = new MfaCrypto("AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE=");
        clock = new MutableClock();
        AdminMfaService target = new AdminMfaService(jdbc, users, crypto, clock);
        ProxyFactory proxy = new ProxyFactory(target);
        proxy.setProxyTargetClass(true);
        proxy.addAdvice(new TransactionInterceptor(new DataSourceTransactionManager(ds), new AnnotationTransactionAttributeSource()));
        service = (AdminMfaService) proxy.getProxy();
    }

    private String approval() {
        String token = crypto.randomToken();
        jdbc.update("INSERT INTO admin_mfa_enrollment_approvals(token_hash,user_id,expires_at) VALUES (?,7,?)",
                MfaCrypto.hash(token), Timestamp.from(clock.instant().plusSeconds(900)));
        return token;
    }

    private String code(String secret) { return MfaCrypto.code(secret, clock.instant().getEpochSecond()/30, 6); }

    @Test void approvalIsRequiredSingleUseAndPendingEnrollmentExpires() {
        assertThatThrownBy(() -> service.enroll(7, "invalid")).isInstanceOf(BusinessException.class);
        String approval = approval();
        var enrollment = service.enroll(7, approval);
        assertThatThrownBy(() -> service.enroll(7, approval)).isInstanceOf(BusinessException.class);
        clock.advance(901);
        assertThatThrownBy(() -> service.confirm(7, code(enrollment.secret()), "access")).isInstanceOf(BusinessException.class);
    }

    @Test void proofsAreBoundToLoginRoleCredentialVersionAndFifteenMinuteExpiry() {
        var enrollment = service.enroll(7, approval());
        var proof = service.confirm(7, code(enrollment.secret()), "access");
        assertThat(service.verified(7, "access", proof.mfaToken())).isTrue();
        assertThat(service.verified(7, "other-login", proof.mfaToken())).isFalse();
        when(actor.getRole()).thenReturn(UserRole.MODERATOR);
        assertThat(service.verified(7, "access", proof.mfaToken())).isFalse();
        when(actor.getRole()).thenReturn(UserRole.ADMIN);
        when(actor.getCredentialVersion()).thenReturn(1);
        assertThat(service.verified(7, "access", proof.mfaToken())).isFalse();
        when(actor.getCredentialVersion()).thenReturn(0);
        clock.advance(900);
        assertThat(service.verified(7, "access", proof.mfaToken())).isFalse();
    }

    @Test void failuresPersistDespiteErrorResponsesAndLockAfterFiveAttempts() {
        var enrollment = service.enroll(7, approval());
        service.confirm(7, code(enrollment.secret()), "access");
        for (int i=0; i<5; i++) assertThatThrownBy(() -> service.verify(7, "wrong", "access")).isInstanceOf(BusinessException.class);
        assertThat(jdbc.queryForObject("SELECT failed_attempts FROM admin_mfa_factors WHERE user_id=7", Integer.class)).isEqualTo(5);
        clock.advance(30);
        assertThatThrownBy(() -> service.verify(7, code(enrollment.secret()), "access"))
                .isInstanceOf(BusinessException.class).hasMessageContaining("15분");
        clock.advance(901);
        assertThat(service.verify(7, code(enrollment.secret()), "access").mfaToken()).isNotBlank();
    }

    @Test void recoveryCodesAreHashedOneTimeAndResetRevokesAllExistingProofs() {
        var enrollment = service.enroll(7, approval());
        var proof = service.confirm(7, code(enrollment.secret()), "access");
        String recovery = proof.recoveryCodes().get(0);
        assertThat(jdbc.queryForObject("SELECT recovery_hashes FROM admin_mfa_factors WHERE user_id=7", String.class)).doesNotContain(recovery);
        var recovered = service.recover(7, recovery, "access");
        assertThatThrownBy(() -> service.recover(7, recovery, "access")).isInstanceOf(BusinessException.class);
        assertThat(service.verified(7, "access", proof.mfaToken())).isFalse();
        assertThat(service.verified(7, "access", recovered.mfaToken())).isTrue();
        service.enroll(7, approval());
        assertThat(service.verified(7, "access", recovered.mfaToken())).isFalse();
    }

    @Test void concurrentUseOfSameTotpHasExactlyOneWinner() throws Exception {
        var enrollment = service.enroll(7, approval());
        service.confirm(7, code(enrollment.secret()), "access");
        clock.advance(30);
        String code = code(enrollment.secret());
        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            Callable<Boolean> attempt = () -> { try { service.verify(7, code, "access"); return true; } catch (BusinessException ex) { return false; } };
            var results = executor.invokeAll(List.of(attempt, attempt));
            assertThat(results.stream().filter(f -> { try { return f.get(); } catch (Exception ex) { throw new RuntimeException(ex); } }).count()).isEqualTo(1);
        } finally { executor.shutdownNow(); }
    }

    @Test void logoutRevokesSessionAndOrdinaryMembersCannotEnroll() {
        var enrollment = service.enroll(7, approval());
        var proof = service.confirm(7, code(enrollment.secret()), "access");
        service.revoke(7);
        assertThat(service.verified(7, "access", proof.mfaToken())).isFalse();
        when(actor.getRole()).thenReturn(UserRole.USER);
        assertThatThrownBy(() -> service.enroll(7, approval())).isInstanceOf(BusinessException.class);
    }

    private static class MutableClock extends Clock {
        private Instant now = Instant.parse("2026-10-11T00:00:00Z");
        void advance(long seconds) { now = now.plusSeconds(seconds); }
        public ZoneId getZone() { return ZoneOffset.UTC; }
        public Clock withZone(ZoneId zone) { return this; }
        public Instant instant() { return now; }
    }
}
