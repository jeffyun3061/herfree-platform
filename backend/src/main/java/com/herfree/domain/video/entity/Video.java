package com.herfree.domain.video.entity;

import com.herfree.domain.board.entity.Board;
import com.herfree.global.common.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

// 유튜브 영상 엔티티 — 직접 업로드 없이 URL과 videoId만 저장해 관리 비용을 낮춘다.
@Getter
@Entity
@Table(name = "videos")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Video extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String title;

    // 원본 URL — 클라이언트가 외부 링크로 사용한다
    @Column(nullable = false, length = 500)
    private String youtubeUrl;

    // videoId만 저장해두면 썸네일·임베드 URL을 서버에서 직접 생성할 수 있다
    @Column(nullable = false, length = 20)
    private String youtubeVideoId;

    // 썸네일 URL — null이면 클라이언트에서 videoId로 직접 생성한다
    @Column(length = 500)
    private String thumbnailUrl;

    @Column(columnDefinition = "TEXT")
    private String description;

    // 관련 게시판 연결 — 선택적이므로 null 허용
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "related_board_id")
    private Board relatedBoard;

    // 노출 여부 — false로 변경하면 API 응답에서 제외된다
    @Column(nullable = false)
    private boolean isVisible;

    @Builder
    private Video(String title, String youtubeUrl, String youtubeVideoId,
                  String thumbnailUrl, String description, Board relatedBoard) {
        this.title = title;
        this.youtubeUrl = youtubeUrl;
        this.youtubeVideoId = youtubeVideoId;
        this.thumbnailUrl = thumbnailUrl;
        this.description = description;
        this.relatedBoard = relatedBoard;
        this.isVisible = true;
    }

    // --- 도메인 메서드 ---

    public void update(String title, String description) {
        this.title = title;
        this.description = description;
    }

    // 노출 여부 전환 — 관리자가 토글 방식으로 제어한다
    public void toggleVisibility(boolean isVisible) {
        this.isVisible = isVisible;
    }
}
