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
import lombok.Getter;
import lombok.NoArgsConstructor;

// 댓글 엔티티 — 상태 변경은 도메인 메서드로만 허용해 비즈니스 의도를 명확히 한다.
// parent_id가 NULL이면 최상위 댓글, 아니면 대댓글이다.
@Getter
@Entity
@Table(name = "comments")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Comment extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 어느 게시글의 댓글인지 식별한다 — 지연 로딩으로 목록 조회 시 불필요한 posts SELECT를 방지
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    // 실제 작성자 — 익명 댓글에서도 DB에는 user_id를 보존해 신고·운영 처리에 활용한다
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // NULL이면 최상위 댓글, NULL이 아니면 parent 댓글에 달린 대댓글이다
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Comment parent;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    // 문자열로 저장하면 enum 항목 추가 시 DB 마이그레이션이 불필요하다
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CommentStatus status;

    // true이면 API 응답에서 작성자 닉네임을 "익명"으로 마스킹한다
    @Column(nullable = false)
    private boolean isAnonymous;

    // --- 정적 팩토리 ---

    // 새 댓글 생성 — 초기 상태는 항상 ACTIVE로 고정한다
    public static Comment create(Post post, User user, String content,
                                 boolean isAnonymous, Comment parent) {
        Comment comment = new Comment();
        comment.post = post;
        comment.user = user;
        comment.content = content;
        comment.isAnonymous = isAnonymous;
        comment.parent = parent;
        comment.status = CommentStatus.ACTIVE;
        return comment;
    }

    // --- 도메인 메서드 ---

    // 관리자 숨김 처리 — 신고 수락 시 또는 직접 운영 조치 시 호출한다
    public void hide() {
        this.status = CommentStatus.HIDDEN;
    }

    // soft delete — 물리 삭제 대신 DELETED 상태로 전환해 신고 이력을 보존한다
    public void delete() {
        this.status = CommentStatus.DELETED;
    }
}
