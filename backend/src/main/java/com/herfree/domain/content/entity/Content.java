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

// 정보 콘텐츠 엔티티 — 운영자·전문가가 작성하는 큐레이션된 정보글
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

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    // 카테고리로 콘텐츠를 분류해 사용자가 원하는 정보를 빠르게 찾을 수 있도록 한다
    @Column(nullable = false, length = 50)
    private String category;

    // CREATOR, DOCTOR, ADMIN — 작성자 타입에 따라 UI에서 배지(badge)를 다르게 표시할 수 있다
    @Column(nullable = false, length = 20)
    private String contentType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ContentStatus status;

    @Builder
    private Content(User author, String title, String content, String category, String contentType) {
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

    // 관리자에 의한 숨김 처리
    public void hide() {
        this.status = ContentStatus.HIDDEN;
    }

    public void show() {
        this.status = ContentStatus.ACTIVE;
    }

    // soft delete
    public void delete() {
        this.status = ContentStatus.DELETED;
    }
}
