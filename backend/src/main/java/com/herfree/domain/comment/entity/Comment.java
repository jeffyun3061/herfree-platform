package com.herfree.domain.comment.entity;

import com.herfree.domain.post.entity.Post;
import com.herfree.domain.user.entity.User;
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

// 댓글 엔티티 — 게시글과 동일하게 상태 변경은 도메인 메서드로만 허용한다
@Getter
@Entity
@Table(name = "comments")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Comment extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    // 익명 댓글도 user_id를 보존하는 이유:
    // 본인 삭제, 신고 처리, 관리자 감사에 user_id가 반드시 필요하다
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // 대댓글 확장을 위한 자기 참조 — 1차 MVP에서는 null만 허용하고 기능은 구현하지 않는다
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Comment parent;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CommentStatus status;

    @Column(nullable = false)
    private boolean isAnonymous;

    @Builder
    private Comment(Post post, User user, Comment parent, String content, boolean isAnonymous) {
        this.post = post;
        this.user = user;
        this.parent = parent;
        this.content = content;
        this.status = CommentStatus.ACTIVE;
        this.isAnonymous = isAnonymous;
    }

    // --- 도메인 메서드 ---

    // 작성자 또는 탈퇴 시 soft delete — 댓글을 물리 삭제하면 게시글 댓글 수가 갑자기 줄어드는 UX 문제가 생긴다
    public void delete() {
        this.status = CommentStatus.DELETED;
    }

    // 관리자에 의한 숨김 — 신고 처리 결과로 호출될 수도 있다
    public void hide() {
        this.status = CommentStatus.HIDDEN;
    }

    // 탈퇴 회원의 댓글은 삭제하지 않고 익명으로 전환한다
    public void anonymize() {
        this.isAnonymous = true;
    }
}
