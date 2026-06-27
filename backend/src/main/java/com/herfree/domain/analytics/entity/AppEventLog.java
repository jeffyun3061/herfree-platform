package com.herfree.domain.analytics.entity;

import com.herfree.domain.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "app_event_logs")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AppEventLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String eventName;

    @Column(nullable = false, length = 30)
    private String source;

    @Column(length = 180)
    private String route;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(length = 80)
    private String sessionHash;

    @Column(length = 80)
    private String ipHash;

    @Column(length = 80)
    private String userAgentHash;

    @Column(nullable = false)
    private LocalDateTime occurredAt;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Builder
    private AppEventLog(
            String eventName,
            String source,
            String route,
            User user,
            String sessionHash,
            String ipHash,
            String userAgentHash
    ) {
        this.eventName = eventName;
        this.source = source;
        this.route = route;
        this.user = user;
        this.sessionHash = sessionHash;
        this.ipHash = ipHash;
        this.userAgentHash = userAgentHash;
        this.occurredAt = LocalDateTime.now();
    }

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (occurredAt == null) {
            occurredAt = createdAt;
        }
    }
}
