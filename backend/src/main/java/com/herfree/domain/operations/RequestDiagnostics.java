package com.herfree.domain.operations;

import java.time.Instant;
import java.util.ArrayDeque;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Component;

/** Bounded process-local metadata; never receives bodies, query strings, users or exceptions. */
@Component
public class RequestDiagnostics {
    public static final int CAPACITY = 1000;
    private final ArrayDeque<Entry> entries = new ArrayDeque<>();
    public record Entry(Instant at, String requestId, String method, String route, int status, long durationMs) {}
    public record Snapshot(Instant sampledAt, int capacity, int retainedCount, int errors,
            long maxDurationMs, List<Entry> entries) {}

    public synchronized void record(String requestId, String method, String route, int status, long durationMs) {
        prune();
        if (entries.size() >= CAPACITY) entries.removeFirst();
        entries.addLast(new Entry(Instant.now(), requestId,
                Set.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD").contains(method) ? method : "OTHER",
                route, status, Math.max(0, durationMs)));
    }

    public synchronized Snapshot snapshot(boolean errorsOnly, String requestId) {
        prune();
        var selected = entries.stream().filter(e -> !errorsOnly || e.status() >= 400)
                .filter(e -> requestId == null || requestId.equals(e.requestId())).toList();
        var newest = new java.util.ArrayList<>(selected);
        java.util.Collections.reverse(newest);
        return new Snapshot(Instant.now(), CAPACITY, entries.size(),
                (int) entries.stream().filter(e -> e.status() >= 500).count(),
                entries.stream().mapToLong(Entry::durationMs).max().orElse(0),
                List.copyOf(newest.subList(0, Math.min(50, newest.size()))));
    }

    private void prune() {
        Instant cutoff = Instant.now().minusSeconds(3600);
        while (!entries.isEmpty() && entries.peekFirst().at().isBefore(cutoff)) entries.removeFirst();
    }
}
