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

// 유튜브 영상 엔티티 — 직접 업로드가 아닌 URL 기반 관리로 스토리지 비용을 절감한다
@Getter
@Entity
@Table(name = "videos")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Video extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 500)
    private String youtubeUrl;

    // videoId를 별도 저장하는 이유: 썸네일(https://img.youtube.com/vi/{videoId}/...) 및
    // 임베드 URL 생성 시 URL에서 매번 파싱하지 않아도 된다
    @Column(nullable = false, length = 20)
    private String youtubeVideoId;

    @Column(length = 500)
    private String thumbnailUrl;

    @Column(columnDefinition = "TEXT")
    private String description;

    // 관련 게시판과 연결해 게시판 페이지에서 관련 영상을 노출할 수 있다
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "related_board_id")
    private Board relatedBoard;

    @Column(nullable = false)
    private boolean isVisible;

    @Column(nullable = false)
    private int sortOrder;

    @Column(nullable = false)
    private boolean isFeatured;

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
        this.sortOrder = 0;
        this.isFeatured = false;
    }

    // --- 도메인 메서드 ---

    public void update(String title, String youtubeUrl, String youtubeVideoId,
                       String thumbnailUrl, String description) {
        this.title = title;
        this.youtubeUrl = youtubeUrl;
        this.youtubeVideoId = youtubeVideoId;
        this.thumbnailUrl = thumbnailUrl;
        this.description = description;
    }

    // 노출 여부를 토글 — 관리자가 임시로 숨기거나 다시 공개할 때 사용한다
    public void updateVisibility(boolean isVisible) {
        this.isVisible = isVisible;
    }

    public void updateSortOrder(int sortOrder) {
        this.sortOrder = sortOrder;
    }

    public void setFeatured(boolean featured) {
        this.isFeatured = featured;
    }
}
