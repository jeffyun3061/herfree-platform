package com.herfree.domain.user.entity;

import com.herfree.global.common.BaseTimeEntity;
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
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "nickname_change_history")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class NicknameChangeHistory extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_user_id")
    private User actor;

    @Column(nullable = false, length = 50)
    private String oldNickname;

    @Column(nullable = false, length = 50)
    private String newNickname;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NicknameChangeType changeType;

    @Column(length = 255)
    private String reason;

    @Builder
    private NicknameChangeHistory(
            User user,
            User actor,
            String oldNickname,
            String newNickname,
            NicknameChangeType changeType,
            String reason
    ) {
        this.user = user;
        this.actor = actor;
        this.oldNickname = oldNickname;
        this.newNickname = newNickname;
        this.changeType = changeType;
        this.reason = reason;
    }
}
