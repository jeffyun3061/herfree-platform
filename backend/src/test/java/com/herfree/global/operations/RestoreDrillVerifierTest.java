package com.herfree.global.operations;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import com.herfree.domain.auth.mfa.MfaCrypto;
import com.herfree.domain.journal.entity.HealthDataStringAttributeConverter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.SingleConnectionDataSource;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;

class RestoreDrillVerifierTest {
    private static final String HEALTH = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
    private static final String MFA = "AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE=";
    private JdbcTemplate jdbc;
    private RestoreDrillVerifier verifier;
    @BeforeEach void setup() {
        var source = new SingleConnectionDataSource("jdbc:h2:mem:restore_" + java.util.UUID.randomUUID() + ";MODE=MySQL;DB_CLOSE_DELAY=-1", "sa", "", true);
        jdbc = new JdbcTemplate(source);
        jdbc.execute("CREATE TABLE flyway_schema_history(success BOOLEAN)");
        jdbc.execute("INSERT INTO flyway_schema_history VALUES(TRUE)");
        jdbc.execute("CREATE TABLE users(id BIGINT)");
        jdbc.execute("CREATE TABLE posts(id BIGINT)");
        jdbc.execute("CREATE TABLE journal_records(memo TEXT)");
        jdbc.execute("CREATE TABLE admin_mfa_factors(user_id BIGINT,secret_encrypted TEXT)");
        jdbc.update("INSERT INTO journal_records VALUES(?)", new HealthDataStringAttributeConverter(HEALTH).convertToDatabaseColumn("restored-private-memo"));
        var crypto = new MfaCrypto(MFA);
        jdbc.update("INSERT INTO admin_mfa_factors VALUES(?,?)", 7L, crypto.encrypt(7L, crypto.newSecret()));
        verifier = new RestoreDrillVerifier(jdbc, new DataSourceTransactionManager(source), org.mockito.Mockito.mock(RestoreCoreFunctionVerifier.class));
    }
    @Test void restoredHealthAndMfaKeysSupportDecryptAndWriteReadVerification() {
        verifier.verifyDatabase(HEALTH, MFA);
    }
    @Test void wrongHealthOrMfaRecoveryKeysFailTheDrill() {
        assertThatThrownBy(() -> verifier.verifyDatabase(MFA, MFA)).isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> verifier.verifyDatabase(HEALTH, HEALTH)).isInstanceOf(IllegalStateException.class);
    }
    @Test void plaintextAndUnsuccessfulMigrationsFailTheDrill() {
        jdbc.update("INSERT INTO journal_records VALUES(?)", "legacy-private-memo");
        assertThatThrownBy(() -> verifier.verifyDatabase(HEALTH, MFA)).isInstanceOf(IllegalStateException.class);
        jdbc.execute("DELETE FROM journal_records");
        jdbc.execute("INSERT INTO flyway_schema_history VALUES(FALSE)");
        assertThatThrownBy(() -> verifier.verifyDatabase(HEALTH, MFA)).isInstanceOf(IllegalStateException.class);
    }
}
