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
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import jakarta.persistence.EntityListeners;

// 신고 엔티티 — 처리 이력이 중요하므로 삭제 없이 status로만 상태를 관리한다.
@Getter
@Entity
@Table(
        name = "reports",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_reports_reporter_target",
                columnNames = {"reporter_id", "target_type", "target_id"}
        )
)
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

    @Column(nullable = false, length = 255)
    private String reason;

    @Column(columnDefinition = "TEXT")
    private String detail;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReportStatus status;

    // 처리한 관리자 ID — 처리 전에는 null
    @Column(name = "processed_by")
    private Long processedBy;

    // 처리 시각 — 처리 전에는 null
    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Builder
    private Report(User reporter, ReportTargetType targetType, Long targetId, String reason, String detail) {
        this.reporter = reporter;
        this.targetType = targetType;
        this.targetId = targetId;
        this.reason = reason;
        this.detail = detail;
        this.status = ReportStatus.PENDING;
    }

    // --- 도메인 메서드 ---

    // 신고 수락 — 처리 관리자와 처리 시각을 기록한다.
    // 실제 콘텐츠 숨김 처리는 ReportService에서 PostService·CommentService를 호출해 담당한다.
    public void accept(Long adminId) {
        this.status = ReportStatus.ACCEPTED;
        this.processedBy = adminId;
        this.processedAt = LocalDateTime.now();
    }

    // 신고 기각 — 허위 또는 정책 위반 아님으로 판단 시 호출된다.
    public void reject(Long adminId) {
        this.status = ReportStatus.REJECTED;
        this.processedBy = adminId;
        this.processedAt = LocalDateTime.now();
    }
}
