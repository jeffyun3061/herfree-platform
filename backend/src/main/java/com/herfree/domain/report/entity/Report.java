package com.herfree.domain.report.entity;

import com.herfree.domain.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import jakarta.persistence.EntityListeners;

// 신고 엔티티 — updated_at이 없는 이유: 신고 내용은 수정되지 않으며, 처리만 된다
@Getter
@Entity
@Table(name = "reports")
@EntityListeners(AuditingEntityListener.class)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id", nullable = false)
    private User reporter;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReportTargetType targetType;

    @Column(nullable = false)
    private Long targetId;

    @Column(nullable = false, length = 100)
    private String reason;

    @Column(columnDefinition = "TEXT")
    private String detail;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReportStatus status;

    // NULL이면 미처리 상태 — 처리된 경우 관리자 User가 설정된다
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "processed_by")
    private User processedBy;

    @Column
    private LocalDateTime processedAt;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Builder
    private Report(User reporter, ReportTargetType targetType, Long targetId,
                   String reason, String detail) {
        this.reporter = reporter;
        this.targetType = targetType;
        this.targetId = targetId;
        this.reason = reason;
        this.detail = detail;
        this.status = ReportStatus.PENDING;
    }

    // --- 도메인 메서드 ---

    // 신고 인정 처리 — 처리자와 처리 시각을 함께 기록해 감사 추적이 가능하다
    public void accept(User admin) {
        this.status = ReportStatus.ACCEPTED;
        this.processedBy = admin;
        this.processedAt = LocalDateTime.now();
    }

    // 신고 기각 처리 — accept와 동일한 방식으로 처리자를 기록한다
    public void reject(User admin) {
        this.status = ReportStatus.REJECTED;
        this.processedBy = admin;
        this.processedAt = LocalDateTime.now();
    }
}
