package com.herfree.domain.operations;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** Reads a root-owned, read-only host snapshot. No AWS requests or credentials reach the browser. */
@Component
public class HostOperationsSnapshot {
    private final Path path;
    private final ObjectMapper mapper;
    private final String environment;
    public record Snapshot(String state, Instant collectedAt, Double memoryPercent, Double rootDiskPercent,
            Double databaseDiskPercent, Boolean databaseHealthy, Boolean httpsHealthy,
            Double backupAgeHours, Double restoreAgeDays, Boolean restoreHealthy) {}

    public HostOperationsSnapshot(ObjectMapper mapper,
            @Value("${app.operations.snapshot-path:/run/herfree-operations/status.json}") String path,
            @Value("${app.operations.environment:unknown}") String environment) {
        this.mapper = mapper; this.path = Path.of(path); this.environment = environment;
    }

    public Snapshot read() {
        try {
            if (!Files.isRegularFile(path) || Files.size(path) > 4096) return unavailable();
            JsonNode node;
            try (var reader = Files.newBufferedReader(path)) { node = mapper.readTree(reader); }
            if (!environment.equals(node.path("environment").asText())) return unavailable();
            Instant at = Instant.parse(node.path("collectedAt").asText());
            long age = java.time.Duration.between(at, Instant.now()).getSeconds();
            if (age < -60) return unavailable();
            return new Snapshot(age > 600 ? "STALE" : "FRESH", at,
                    number(node, "memoryPercent", 100), number(node, "rootDiskPercent", 100),
                    number(node, "databaseDiskPercent", 100), bool(node, "databaseHealthy"), bool(node, "httpsHealthy"),
                    number(node, "backupAgeHours", 10000), number(node, "restoreAgeDays", 10000), bool(node, "restoreHealthy"));
        } catch (Exception ignored) { return unavailable(); }
    }

    private static Double number(JsonNode node, String key, double max) {
        JsonNode value = node.get(key);
        if (value == null || !value.isNumber()) return null;
        double n = value.doubleValue();
        return Double.isFinite(n) && n >= 0 && n <= max ? n : null;
    }
    private static Boolean bool(JsonNode node, String key) {
        JsonNode value = node.get(key);
        return value != null && value.isBoolean() ? value.booleanValue() : null;
    }
    private static Snapshot unavailable() {
        return new Snapshot("UNAVAILABLE", null, null, null, null, null, null, null, null, null);
    }
}
