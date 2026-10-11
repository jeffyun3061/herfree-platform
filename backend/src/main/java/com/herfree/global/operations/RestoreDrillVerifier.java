package com.herfree.global.operations;

import com.herfree.domain.journal.entity.HealthDataStringAttributeConverter;
import com.herfree.domain.auth.mfa.MfaCrypto;
import java.sql.ResultSet;
import java.nio.file.Files;
import java.nio.file.Path;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.transaction.PlatformTransactionManager;

/** Only runs in the network-isolated restore container; never emits restored personal data. */
@Component
@Profile("restore-drill")
public class RestoreDrillVerifier implements ApplicationRunner {
    private final JdbcTemplate jdbc;
    private final TransactionTemplate transaction;
    public RestoreDrillVerifier(JdbcTemplate jdbc, PlatformTransactionManager manager) {
        this.jdbc = jdbc; this.transaction = new TransactionTemplate(manager);
    }

    @Override public void run(ApplicationArguments args) throws Exception {
        verifyDatabase(System.getenv("HEALTH_DATA_ENCRYPTION_KEY"), System.getenv("ADMIN_MFA_ENCRYPTION_KEY"));
        Files.writeString(Path.of("/verification/success"), "restore verification passed\n");
        System.exit(0);
    }

    void verifyDatabase(String healthKey, String mfaKey) {
        if (healthKey == null || healthKey.isBlank() || mfaKey == null || mfaKey.isBlank())
            throw new IllegalStateException("Recovery keys required");
        var cipher = new HealthDataStringAttributeConverter(healthKey);
        Long unsuccessful = jdbc.queryForObject("SELECT COUNT(*) FROM flyway_schema_history WHERE success=FALSE", Long.class);
        Long migrations = jdbc.queryForObject("SELECT COUNT(*) FROM flyway_schema_history WHERE success=TRUE", Long.class);
        if (unsuccessful == null || unsuccessful != 0 || migrations == null || migrations == 0)
            throw new IllegalStateException("Restored migration history invalid");
        Long plaintext = jdbc.queryForObject("SELECT COUNT(*) FROM journal_records WHERE memo IS NOT NULL AND memo<>'' AND memo NOT LIKE 'v1:%'", Long.class);
        if (plaintext == null || plaintext != 0) throw new IllegalStateException("Unencrypted journal memos remain");
        // Decrypt actual restored values in memory without printing or returning the contents.
        jdbc.query("SELECT memo FROM journal_records WHERE memo LIKE 'v1:%'", (ResultSet rs) -> {
            cipher.convertToEntityAttribute(rs.getString(1));
        });
        var mfaCipher = new MfaCrypto(mfaKey);
        jdbc.query("SELECT user_id, secret_encrypted FROM admin_mfa_factors", (ResultSet rs) -> {
            mfaCipher.decrypt(rs.getLong(1), rs.getString(2));
        });
        for (String table : java.util.List.of("users", "posts", "journal_records"))
            jdbc.queryForObject("SELECT COUNT(*) FROM " + table, Long.class);
        jdbc.execute("CREATE TEMPORARY TABLE herfree_restore_write_smoke (ciphertext TEXT)");
        try {
            transaction.executeWithoutResult(status -> {
                String encrypted = cipher.convertToDatabaseColumn("herfree-restore-smoke");
                jdbc.update("INSERT INTO herfree_restore_write_smoke(ciphertext) VALUES (?)", encrypted);
                String read = jdbc.queryForObject("SELECT ciphertext FROM herfree_restore_write_smoke", String.class);
                if (!"herfree-restore-smoke".equals(cipher.convertToEntityAttribute(read)))
                    throw new IllegalStateException("Restored write/read verification failed");
                status.setRollbackOnly();
            });
        } finally { jdbc.execute("DROP TABLE herfree_restore_write_smoke"); }
    }
}
