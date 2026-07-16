package com.herfree.domain.analytics.repository;

import com.herfree.domain.analytics.entity.AppEventLog;
import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AppEventLogRepository extends JpaRepository<AppEventLog, Long> {

    long countByOccurredAtAfter(Instant since);

    @Modifying
    @Query("DELETE FROM AppEventLog e WHERE e.createdAt < :cutoff")
    int deleteCreatedBefore(@Param("cutoff") Instant cutoff);

    @Query("""
            SELECT e.eventName AS eventName, COUNT(e) AS count
            FROM AppEventLog e
            WHERE e.occurredAt >= :since
            GROUP BY e.eventName
            ORDER BY COUNT(e) DESC
            """)
    List<EventCountRow> countByEventNameSince(@Param("since") Instant since);

    interface EventCountRow {
        String getEventName();

        long getCount();
    }
}
