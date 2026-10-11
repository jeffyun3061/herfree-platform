package com.herfree.domain.auth.mfa;

import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.entity.UserRole;
import com.herfree.domain.user.entity.UserStatus;
import com.herfree.domain.user.repository.UserRepository;
import com.herfree.global.exception.BusinessException;
import com.herfree.global.exception.ErrorCode;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminMfaService {
    private final JdbcTemplate jdbc;
    private final UserRepository users;
    private final MfaCrypto crypto;
    private final Clock clock;

    @Autowired
    public AdminMfaService(JdbcTemplate jdbc, UserRepository users, MfaCrypto crypto) {
        this(jdbc, users, crypto, Clock.systemUTC());
    }

    AdminMfaService(JdbcTemplate jdbc, UserRepository users, MfaCrypto crypto, Clock clock) {
        this.jdbc = jdbc; this.users = users; this.crypto = crypto; this.clock = clock;
    }

    public static boolean canUseAdminApi(UserRole role) {
        return role != null && java.util.Set.of(UserRole.ADMIN, UserRole.SUPER_ADMIN,
                UserRole.MODERATOR, UserRole.DOCTOR, UserRole.CREATOR).contains(role);
    }

    private User user(long id, boolean lock) {
        User result = (lock ? users.findByIdAndStatusForUpdate(id, UserStatus.ACTIVE)
                : users.findByIdAndStatus(id, UserStatus.ACTIVE))
                .orElseThrow(() -> new BusinessException(ErrorCode.FORBIDDEN));
        if (!canUseAdminApi(result.getRole())) throw new BusinessException(ErrorCode.FORBIDDEN);
        return result;
    }

    public record Status(boolean enrolled, boolean verified, long expiresIn) {}
    public record Enrollment(String secret, String otpauthUri, long expiresIn) {}
    public record Verification(String mfaToken, long expiresIn, List<String> recoveryCodes) {}
    private record Factor(String encrypted, boolean enabled, Instant pendingExpiry,
            long lastStep, int failures, Instant lockedUntil, String hashes) {}

    private Factor factor(long id) {
        return jdbc.query("SELECT * FROM admin_mfa_factors WHERE user_id = ? FOR UPDATE", (rs, n) ->
                new Factor(rs.getString("secret_encrypted"), rs.getBoolean("enabled"),
                        instant(rs.getTimestamp("pending_expires_at")), rs.getLong("last_used_step"),
                        rs.getInt("failed_attempts"), instant(rs.getTimestamp("locked_until")),
                        rs.getString("recovery_hashes")), id).stream().findFirst()
                .orElseThrow(() -> new BusinessException(ErrorCode.ADMIN_MFA_REQUIRED));
    }

    private static Instant instant(Timestamp timestamp) { return timestamp == null ? null : timestamp.toInstant(); }

    public Status status(long id, String accessToken, String session) {
        user(id, false);
        boolean enrolled = !jdbc.queryForList(
                "SELECT user_id FROM admin_mfa_factors WHERE user_id = ? AND enabled = TRUE", id).isEmpty();
        Instant expiry = sessionExpiry(id, accessToken, session);
        return new Status(enrolled, expiry != null, expiry == null ? 0 : Math.max(0, expiry.getEpochSecond() - clock.instant().getEpochSecond()));
    }

    public boolean verified(long id, String accessToken, String session) {
        return sessionExpiry(id, accessToken, session) != null;
    }

    private Instant sessionExpiry(long id, String accessToken, String session) {
        if (session == null || !session.matches("[A-Za-z0-9_-]{43}") || accessToken == null) return null;
        User actor;
        try { actor = user(id, false); }
        catch (BusinessException ex) { return null; }
        return jdbc.query("""
                SELECT s.expires_at FROM admin_mfa_sessions s
                JOIN admin_mfa_factors f ON f.user_id=s.user_id AND f.enabled=TRUE
                WHERE s.token_hash=? AND s.user_id=? AND s.access_token_hash=?
                  AND s.credential_version=? AND s.role_name=? AND s.expires_at>?
                """, (rs, n) -> rs.getTimestamp(1).toInstant(), MfaCrypto.hash(session), id,
                MfaCrypto.hash(accessToken), actor.getCredentialVersion(), actor.getRole().name(),
                Timestamp.from(clock.instant())).stream().findFirst().orElse(null);
    }

    /** Enrollment and lost-device resets both require an independently approved, single-use ticket. */
    @Transactional
    public Enrollment enroll(long id, String approvalCode) {
        user(id, true);
        int consumed = jdbc.update("""
                UPDATE admin_mfa_enrollment_approvals SET consumed_at=?
                WHERE token_hash=? AND user_id=? AND consumed_at IS NULL AND expires_at>?
                """, Timestamp.from(clock.instant()), MfaCrypto.hash(approvalCode), id, Timestamp.from(clock.instant()));
        if (consumed != 1) throw new BusinessException(ErrorCode.ADMIN_MFA_APPROVAL_REQUIRED);
        String secret = crypto.newSecret();
        String encrypted = crypto.encrypt(id, secret);
        jdbc.update("DELETE FROM admin_mfa_sessions WHERE user_id=?", id);
        jdbc.update("DELETE FROM admin_mfa_factors WHERE user_id=?", id);
        jdbc.update("""
                INSERT INTO admin_mfa_factors(user_id, secret_encrypted, enabled, pending_expires_at,
                    last_used_step, failed_attempts, recovery_hashes) VALUES (?, ?, FALSE, ?, -1, 0, '')
                """, id, encrypted, Timestamp.from(clock.instant().plusSeconds(900)));
        return new Enrollment(secret, "otpauth://totp/Herfree:admin-" + id
                + "?secret=" + secret + "&issuer=Herfree&algorithm=SHA1&digits=6&period=30", 900);
    }

    // Failed attempts must commit even though the API returns an error. The user row serializes all proofs.
    @Transactional(noRollbackFor = BusinessException.class)
    public Verification confirm(long id, String code, String accessToken) {
        User actor = user(id, true);
        Factor f = factor(id);
        if (f.enabled || f.pendingExpiry == null || !f.pendingExpiry.isAfter(clock.instant()))
            throw new BusinessException(ErrorCode.ADMIN_MFA_APPROVAL_REQUIRED);
        acceptCode(id, f, code);
        List<String> codes = new ArrayList<>();
        for (int i = 0; i < 8; i++) codes.add(crypto.randomToken());
        jdbc.update("UPDATE admin_mfa_factors SET enabled=TRUE, pending_expires_at=NULL, recovery_hashes=? WHERE user_id=?",
                String.join("\n", codes.stream().map(MfaCrypto::hash).toList()), id);
        return session(actor, accessToken, codes);
    }

    @Transactional(noRollbackFor = BusinessException.class)
    public Verification verify(long id, String code, String accessToken) {
        User actor = user(id, true);
        Factor f = factor(id);
        if (!f.enabled) throw new BusinessException(ErrorCode.ADMIN_MFA_REQUIRED);
        acceptCode(id, f, code);
        return session(actor, accessToken, List.of());
    }

    @Transactional(noRollbackFor = BusinessException.class)
    public Verification recover(long id, String recoveryCode, String accessToken) {
        User actor = user(id, true);
        Factor f = factor(id);
        if (!f.enabled) throw new BusinessException(ErrorCode.ADMIN_MFA_REQUIRED);
        checkLock(f);
        List<String> hashes = new ArrayList<>(List.of(f.hashes.split("\n")));
        if (!hashes.remove(MfaCrypto.hash(recoveryCode))) fail(id, f);
        jdbc.update("UPDATE admin_mfa_factors SET recovery_hashes=?, failed_attempts=0, locked_until=NULL WHERE user_id=?",
                String.join("\n", hashes), id);
        return session(actor, accessToken, List.of());
    }

    private void checkLock(Factor f) {
        if (f.lockedUntil != null && f.lockedUntil.isAfter(clock.instant()))
            throw new BusinessException(ErrorCode.ADMIN_MFA_LOCKED);
    }

    private void acceptCode(long id, Factor f, String code) {
        checkLock(f);
        long step = crypto.matchingStep(crypto.decrypt(id, f.encrypted), code, clock.instant().getEpochSecond(), f.lastStep);
        if (step < 0) fail(id, f);
        jdbc.update("UPDATE admin_mfa_factors SET last_used_step=?, failed_attempts=0, locked_until=NULL WHERE user_id=?", step, id);
    }

    private void fail(long id, Factor f) {
        int failures = f.lockedUntil != null ? 1 : f.failures + 1;
        jdbc.update("UPDATE admin_mfa_factors SET failed_attempts=?, locked_until=? WHERE user_id=?", failures,
                failures >= 5 ? Timestamp.from(clock.instant().plusSeconds(900)) : null, id);
        throw new BusinessException(failures >= 5 ? ErrorCode.ADMIN_MFA_LOCKED : ErrorCode.ADMIN_MFA_INVALID);
    }

    private Verification session(User actor, String accessToken, List<String> recoveryCodes) {
        Objects.requireNonNull(accessToken);
        String token = crypto.randomToken();
        jdbc.update("DELETE FROM admin_mfa_sessions WHERE user_id=?", actor.getId());
        jdbc.update("DELETE FROM admin_mfa_sessions WHERE expires_at<=?", Timestamp.from(clock.instant()));
        jdbc.update("DELETE FROM admin_mfa_enrollment_approvals WHERE expires_at<=?", Timestamp.from(clock.instant()));
        jdbc.update("""
                INSERT INTO admin_mfa_sessions(token_hash,user_id,access_token_hash,credential_version,role_name,expires_at)
                VALUES (?,?,?,?,?,?)
                """, MfaCrypto.hash(token), actor.getId(), MfaCrypto.hash(accessToken), actor.getCredentialVersion(),
                actor.getRole().name(), Timestamp.from(clock.instant().plusSeconds(900)));
        return new Verification(token, 900, recoveryCodes);
    }

    @Transactional
    public void revoke(long id) { jdbc.update("DELETE FROM admin_mfa_sessions WHERE user_id=?", id); }
}
