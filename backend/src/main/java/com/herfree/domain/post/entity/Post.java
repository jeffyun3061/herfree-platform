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

// 게시글 엔티티 — 상태 변경은 setter 없이 도메인 메서드로만 허용한다.
// 이렇게 설계하면 "게시글을 숨긴다"는 비즈니스 행위가 코드에 명시적으로 드러난다.
@Getter
@Entity
@Table(name = "posts")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Post extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // FetchType.LAZY: 게시글 목록 조회 시 Board를 매번 로딩하면 N+1 문제가 생긴다.
    // 실제로 Board 정보가 필요한 시점에만 SELECT가 실행되도록 지연 로딩을 사용한다.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id", nullable = false)
    private Board board;

    // 작성자 정보 — user_id는 익명 글에서도 DB에 보존된다(감사, 신고 처리 목적)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    // 조회수 — 기본값 0, DB 레벨에서도 NOT NULL DEFAULT 0으로 보장
    @Column(nullable = false)
    private int viewCount;

    // 문자열로 저장해 DB 마이그레이션 없이 enum 값을 추가할 수 있게 한다
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PostStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PostVisibility visibility;

    // 익명 여부 — true이면 API 응답에서 작성자 닉네임을 "익명"으로 마스킹한다
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
        // 새 게시글은 항상 ACTIVE 상태로 시작한다
        this.status = PostStatus.ACTIVE;
        this.visibility = (visibility != null) ? visibility : PostVisibility.PUBLIC;
        this.isAnonymous = isAnonymous;
    }

    // --- 도메인 메서드 ---

    // 게시글 수정 — 제목·내용·익명 여부만 변경 가능하다.
    // 게시판 이동은 허용하지 않아 board_id는 변경 대상에서 제외한다.
    public void update(String title, String content, boolean isAnonymous) {
        this.title = title;
        this.content = content;
        this.isAnonymous = isAnonymous;
    }

    // 관리자 숨김 처리 — 신고 수락 시 또는 직접 운영 조치 시 호출된다.
    // 작성자에게는 숨겨진 이유를 별도 알림으로 전달하는 것이 좋지만, 1차 MVP에서는 생략한다.
    public void hide() {
        this.status = PostStatus.HIDDEN;
    }

    // 작성자 삭제 또는 탈퇴 연동 삭제 — 물리 삭제 대신 DELETED 상태로 전환한다.
    // 댓글·반응 등 연관 데이터를 즉시 삭제하면 참조 무결성 오류가 생기므로 soft delete를 사용한다.
    public void delete() {
        this.status = PostStatus.DELETED;
    }

    // 조회 시마다 호출되어 viewCount를 1 증가시킨다.
    // 중복 조회 방지(Redis 등)는 1.5차 확장에서 구현 예정이다.
    public void increaseViewCount() {
        this.viewCount++;
    }
}
