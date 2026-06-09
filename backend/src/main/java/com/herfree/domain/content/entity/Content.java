package com.herfree.domain.content.entity;

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

// 정보 콘텐츠 엔티티 — 크리에이터·전문가·운영자가 작성하는 정보성 글을 관리한다.
@Getter
@Entity
@Table(name = "contents")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Content extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    // 카테고리 예시: BASIC, TEST, RECURRENCE, PREVENTION, RELATIONSHIP, FAQ
    @Column(nullable = false, length = 50)
    private String category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ContentType contentType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ContentStatus status;

    @Builder
    private Content(User author, String title, String content, String category, ContentType contentType) {
        this.author = author;
        this.title = title;
        this.content = content;
        this.category = category;
        this.contentType = contentType;
        this.status = ContentStatus.ACTIVE;
    }

    // --- 도메인 메서드 ---

    public void update(String title, String content, String category) {
        this.title = title;
        this.content = content;
        this.category = category;
    }

    public void hide() {
        this.status = ContentStatus.HIDDEN;
    }

    public void delete() {
        this.status = ContentStatus.DELETED;
    }
}
