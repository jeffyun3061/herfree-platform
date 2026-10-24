package com.herfree.domain.journal.service;

import com.herfree.domain.journal.entity.HealthDataStringAttributeConverter;
import java.sql.PreparedStatement;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * One-shot staging migration for legacy plaintext journal memos.
 *
 * <p>It is deliberately opt-in and refuses to run outside the staging profile.
 * The query reads only rows that are not already encrypted and never logs memo
 * contents.</p>
 */
@Component
@ConditionalOnProperty(name = "app.health-data.rekey-on-startup", havingValue = "true")
public class HealthDataRekeyRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(HealthDataRekeyRunner.class);
    private final JdbcTemplate jdbcTemplate;
    private final Environment environment;

    public HealthDataRekeyRunner(JdbcTemplate jdbcTemplate, Environment environment) {
        this.jdbcTemplate = jdbcTemplate;
        this.environment = environment;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!List.of(environment.getActiveProfiles()).contains("staging")) {
            throw new IllegalStateException("health data re-key is allowed only in the staging profile");
        }

        String keyMaterial = environment.getProperty("app.health-data.encryption-key", "");
        HealthDataStringAttributeConverter converter = new HealthDataStringAttributeConverter(keyMaterial);
        long lastId = 0;
        int count = 0;
        while (true) {
            List<LegacyMemo> rows = jdbcTemplate.query(
                    "SELECT id, memo FROM journal_records "
                            + "WHERE id > ? AND memo IS NOT NULL AND memo <> '' AND memo NOT LIKE 'v1:%' "
                            + "ORDER BY id LIMIT 100",
                    (rs, rowNum) -> new LegacyMemo(rs.getLong("id"), rs.getString("memo")),
                    lastId);
            if (rows.isEmpty()) {
                break;
            }

            int[][] updated = jdbcTemplate.batchUpdate(
                    "UPDATE journal_records SET memo = ? WHERE id = ? AND memo NOT LIKE 'v1:%'",
                    rows,
                    100,
                    (PreparedStatement ps, LegacyMemo row) -> {
                        ps.setString(1, converter.convertToDatabaseColumn(row.memo()));
                        ps.setLong(2, row.id());
                    });
            for (int[] batch : updated) {
                for (int result : batch) {
                    if (result > 0) {
                        count += result;
                    }
                }
            }
            lastId = rows.get(rows.size() - 1).id();
        }
        if (count == 0) {
            log.info("health data re-key completed: no legacy journal memos found");
            return;
        }
        log.info("health data re-key completed: {} journal memos encrypted", count);
    }

    private record LegacyMemo(long id, String memo) {
    }
}
