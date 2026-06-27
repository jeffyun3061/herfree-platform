package com.herfree.domain.analytics.repository;

import com.herfree.domain.analytics.entity.AppEventLog;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AppEventLogRepository extends JpaRepository<AppEventLog, Long> {

    long countByOccurredAtAfter(LocalDateTime since);

    @Query("""
            SELECT e.eventName AS eventName, COUNT(e) AS count
            FROM AppEventLog e
            WHERE e.occurredAt >= :since
            GROUP BY e.eventName
            ORDER BY COUNT(e) DESC
            """)
    List<EventCountRow> countByEventNameSince(@Param("since") LocalDateTime since);

    interface EventCountRow {
        String getEventName();

        long getCount();
    }
}
