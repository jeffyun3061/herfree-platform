package com.herfree.domain.post.entity;

import com.herfree.domain.board.entity.Board;
import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.entity.CommunityHealthConsent;
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
import jakarta.persistence.Version;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 게시글 엔티티 — 상태 변경은 반드시 도메인 메서드를 통해야 한다.
// setter를 열어두면 어디서든 상태를 직접 바꿀 수 있어 비즈니스 규칙이 흩어진다.
@Getter
@Entity
@Table(name = "posts")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Post extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Version @Column(name = "row_version", nullable = false, columnDefinition = "BIGINT DEFAULT 0")
    private long rowVersion;

    // LAZY 로딩: 게시글 조회 시 게시판 전체를 불필요하게 로딩하지 않기 위해 지연 로딩 사용
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id", nullable = false)
    private Board board;

    // 익명 글도 user_id는 DB에 유지한다 — 신고·관리자 처리·본인 식별에 반드시 필요하다
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "community_health_consent_id")
    private CommunityHealthConsent communityHealthConsent;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "rich_content", columnDefinition = "LONGTEXT")
    private String richContent;

    @Column(name = "share_title_publicly", nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    private boolean shareTitlePublicly;

    // 조회수는 매 요청마다 +1되므로, 읽기 성능에 영향을 줄 수 있다.
    // 트래픽이 많아지면 Redis 캐시로 관리하고 주기적으로 DB에 반영하는 방식을 고려한다.
    @Column(nullable = false)
    private int viewCount;

    // ACTIVE 댓글 수 — 목록 댓글순 정렬·표시용 (CommentService에서 동기화)
    @Column(nullable = false)
    private int commentCount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PostStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PostVisibility visibility;

    // true이면 API 응답에서 닉네임을 "익명"으로 마스킹한다
    // user_id 자체는 DB에 남겨서 본인 수정·삭제가 가능하다
    @Column(nullable = false)
    private boolean isAnonymous;

    // 기존 게시글의 마스킹 IP 값. 새 글에서는 저장하지 않고 API에도 노출하지 않는다.
    @Column(name = "author_ip_masked", length = 24)
    private String authorIpMasked;

    @Column(nullable = false)
    private int sortOrder;

    @Column(nullable = false)
    private boolean isPinned;

    @Builder
    private Post(Board board, User user, String title, String content,
                 PostVisibility visibility, boolean isAnonymous, String authorIpMasked) {
        this.board = board;
        this.user = user;
        this.title = title;
        this.content = content;
        this.viewCount = 0;
        this.commentCount = 0;
        this.status = PostStatus.ACTIVE;
        this.visibility = (visibility != null) ? visibility : PostVisibility.PUBLIC;
        this.isAnonymous = isAnonymous;
        this.authorIpMasked = authorIpMasked;
        this.sortOrder = 0;
        this.isPinned = false;
    }

    // --- 도메인 메서드 ---

    // 게시글 내용 수정 — setter 대신 명시적인 도메인 메서드를 써서 "수정"이라는 행위를 표현한다
    public void update(String title, String content, boolean isAnonymous) {
        if (status == PostStatus.CONSENT_WITHDRAWN) throw new IllegalStateException("Withdrawn community content cannot be edited");
        // A changed title needs a fresh, explicit sharing choice.
        this.shareTitlePublicly = false;
        this.title = title;
        this.content = content;
        this.isAnonymous = isAnonymous;
        this.richContent = null;
    }

    public void updateRichContent(String validatedRichContent) { this.richContent = validatedRichContent; }

    public void setShareTitlePublicly(boolean shareTitlePublicly) { this.shareTitlePublicly = shareTitlePublicly; }

    // 관리자에 의한 숨김 처리 — 작성자는 볼 수 없지만 데이터는 보존된다
    // 신고 처리 결과로도 호출될 수 있으므로 도메인 메서드로 분리한다
    public void hide() {
        if (status == PostStatus.CONSENT_WITHDRAWN) return;
        this.status = PostStatus.HIDDEN;
    }

    public void restore() {
        if (status == PostStatus.CONSENT_WITHDRAWN) return;
        this.status = PostStatus.ACTIVE;
    }

    // 작성자 또는 탈퇴 시 soft delete — 물리 삭제를 피하는 이유는 연관 댓글·신고 데이터를 보존하기 위함이다
    public void delete() {
        if (status == PostStatus.CONSENT_WITHDRAWN) return;
        this.status = PostStatus.DELETED;
    }

    // 탈퇴 회원의 글은 삭제하지 않고 익명으로 전환한다 — 커뮤니티 맥락을 유지하기 위함이다
    public void anonymize() {
        this.isAnonymous = true;
    }

    public void updateSortOrder(int sortOrder) {
        this.sortOrder = sortOrder;
    }

    public void pin() {
        this.isPinned = true;
    }

    public void unpin() {
        this.isPinned = false;
    }

    public void setPinned(boolean pinned) {
        this.isPinned = pinned;
    }

    public void linkCommunityHealthConsent(CommunityHealthConsent consent) {
        if (consent == null || !consent.isAgreed() || !java.util.Objects.equals(user.getId(), consent.getUser().getId()))
            throw new IllegalArgumentException("Consent must belong to the content author");
        communityHealthConsent = consent;
    }
    public void withdrawCommunityHealthConsent() {
        if (communityHealthConsent == null) throw new IllegalStateException("Legacy content has no community consent provenance");
        status = PostStatus.CONSENT_WITHDRAWN;
        shareTitlePublicly = false;
    }
    public void removeActiveComments(int count) {
        if (count < 0) throw new IllegalArgumentException("Comment count must be nonnegative");
        commentCount = Math.max(0, commentCount - count);
    }
}
