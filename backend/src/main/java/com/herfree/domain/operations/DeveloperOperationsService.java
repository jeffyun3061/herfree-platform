package com.herfree.domain.operations;

import com.zaxxer.hikari.HikariDataSource;
import java.lang.management.ManagementFactory;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import javax.sql.DataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class DeveloperOperationsService {
    private final DataSource source;
    private final HostOperationsSnapshot host;
    private final String image;
    private final String environment;
    private volatile Overview cached;
    public record TableSize(String name, long estimatedRows, long bytes) {}
    public record Database(String state, String version, String migrationVersion, Boolean migrationsSuccessful,
            List<TableSize> tables, Integer poolActive, Integer poolIdle, Integer poolWaiting) {}
    public record Overview(Instant sampledAt, String environment, String image, long uptimeSeconds,
            long heapUsedBytes, long heapMaxBytes, Database database, HostOperationsSnapshot.Snapshot host) {}

    public DeveloperOperationsService(DataSource source, HostOperationsSnapshot host,
            @Value("${app.operations.image:unknown}") String image,
            @Value("${app.operations.environment:unknown}") String environment) {
        this.source = source; this.host = host; this.image = image; this.environment = environment;
    }

    public synchronized Overview overview() {
        if (cached != null && cached.sampledAt().isAfter(Instant.now().minusSeconds(15))) return cached;
        var heap = ManagementFactory.getMemoryMXBean().getHeapMemoryUsage();
        // A deployment identifier is allowed; never return environment variables or JDBC settings.
        String safeImage = image.matches("[A-Za-z0-9./:@_-]{1,240}") ? image : "unknown";
        cached = new Overview(Instant.now(), environment, safeImage,
                ManagementFactory.getRuntimeMXBean().getUptime() / 1000, heap.getUsed(), heap.getMax(), database(), host.read());
        return cached;
    }

    private Database database() {
        Integer active = null, idle = null, waiting = null;
        if (source instanceof HikariDataSource hikari && hikari.getHikariPoolMXBean() != null) {
            var pool = hikari.getHikariPoolMXBean();
            active = pool.getActiveConnections(); idle = pool.getIdleConnections(); waiting = pool.getThreadsAwaitingConnection();
        }
        String version = null, migration = null;
        Boolean successful = null;
        var tables = new ArrayList<TableSize>();
        try (Connection connection = source.getConnection()) {
            connection.setReadOnly(true);
            try (Statement statement = connection.createStatement()) {
                statement.setQueryTimeout(3);
                try (ResultSet result = statement.executeQuery("SELECT 1")) {
                    if (!result.next() || result.getInt(1) != 1) throw new java.sql.SQLException();
                }
                version = connection.getMetaData().getDatabaseProductVersion();
                if (version != null) {
                    version = version.replaceAll("[^A-Za-z0-9._ -]", "");
                    version = version.substring(0, Math.min(version.length(), 64));
                }
                if ("MySQL".equals(connection.getMetaData().getDatabaseProductName())) {
                    try (ResultSet result = statement.executeQuery("""
                            SELECT table_name, COALESCE(table_rows,0), COALESCE(data_length,0)+COALESCE(index_length,0)
                            FROM information_schema.tables WHERE table_schema=DATABASE() AND table_type='BASE TABLE'
                            ORDER BY table_name LIMIT 100
                            """)) {
                        while (result.next()) tables.add(new TableSize(result.getString(1), result.getLong(2), result.getLong(3)));
                    } catch (java.sql.SQLException ignored) { /* Restricted metadata is explicitly unavailable. */ }
                }
                try (ResultSet result = statement.executeQuery("SELECT version, success FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 1")) {
                    if (result.next()) { migration = result.getString(1); successful = result.getBoolean(2); }
                } catch (java.sql.SQLException ignored) { /* Local tests and restricted metadata may omit Flyway. */ }
            }
            return new Database("UP", version, migration, successful, List.copyOf(tables), active, idle, waiting);
        } catch (java.sql.SQLException ignored) {
            return new Database("DOWN", null, null, null, List.of(), active, idle, waiting);
        }
    }
}
