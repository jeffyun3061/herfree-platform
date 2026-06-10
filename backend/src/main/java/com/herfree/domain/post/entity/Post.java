package com.herfree.domain.post.entity;

import com.herfree.domain.board.entity.Board;
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

    // LAZY 로딩: 게시글 조회 시 게시판 전체를 불필요하게 로딩하지 않기 위해 지연 로딩 사용
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id", nullable = false)
    private Board board;

    // 익명 글도 user_id는 DB에 유지한다 — 신고·관리자 처리·본인 식별에 반드시 필요하다
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    // 조회수는 매 요청마다 +1되므로, 읽기 성능에 영향을 줄 수 있다.
    // 트래픽이 많아지면 Redis 캐시로 관리하고 주기적으로 DB에 반영하는 방식을 고려한다.
    @Column(nullable = false)
    private int viewCount;

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

    @Builder
    private Post(Board board, User user, String title, String content,
                 PostVisibility visibility, boolean isAnonymous) {
        this.board = board;
        this.user = user;
        this.title = title;
        this.content = content;
        this.viewCount = 0;
        this.status = PostStatus.ACTIVE;
        this.visibility = (visibility != null) ? visibility : PostVisibility.PUBLIC;
        this.isAnonymous = isAnonymous;
    }

    // --- 도메인 메서드 ---

    // 게시글 내용 수정 — setter 대신 명시적인 도메인 메서드를 써서 "수정"이라는 행위를 표현한다
    public void update(String title, String content, boolean isAnonymous) {
        this.title = title;
        this.content = content;
        this.isAnonymous = isAnonymous;
    }

    // 관리자에 의한 숨김 처리 — 작성자는 볼 수 없지만 데이터는 보존된다
    // 신고 처리 결과로도 호출될 수 있으므로 도메인 메서드로 분리한다
    public void hide() {
        this.status = PostStatus.HIDDEN;
    }

    // 작성자 또는 탈퇴 시 soft delete — 물리 삭제를 피하는 이유는 연관 댓글·신고 데이터를 보존하기 위함이다
    public void delete() {
        this.status = PostStatus.DELETED;
    }

    // 탈퇴 회원의 글은 삭제하지 않고 익명으로 전환한다 — 커뮤니티 맥락을 유지하기 위함이다
    public void anonymize() {
        this.isAnonymous = true;
    }

    // 조회수는 도메인 메서드로 관리해 단순 필드 접근과 의도를 구분한다.
    // 동시성 이슈(Race condition)는 향후 낙관적 락 또는 Redis 카운터로 해결한다.
    public void increaseViewCount() {
        this.viewCount++;
    }
}
