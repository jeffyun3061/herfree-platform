package com.herfree.domain.reaction.entity;

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

// 반응 엔티티 — updatedAt이 없는 이유: 반응은 등록과 삭제만 존재하며 수정이 없다
@Getter
@Entity
@Table(name = "reactions")
@EntityListeners(AuditingEntityListener.class)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Reaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // 다형 연관 패턴 — target_type과 target_id를 분리해 POST, COMMENT를 하나의 테이블로 관리한다.
    // FK를 걸지 않는 이유: 대상 타입이 추후 추가될 때 스키마 변경 없이 처리할 수 있다.
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReactionTargetType targetType;

    @Column(nullable = false)
    private Long targetId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReactionType reactionType;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Builder
    private Reaction(User user, ReactionTargetType targetType, Long targetId, ReactionType reactionType) {
        this.user = user;
        this.targetType = targetType;
        this.targetId = targetId;
        this.reactionType = reactionType;
    }
}
