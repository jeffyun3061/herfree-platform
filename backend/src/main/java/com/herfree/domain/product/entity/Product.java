package com.herfree.domain.product.entity;

import com.herfree.global.common.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 제품 큐레이션 엔티티 — 외부 구매 링크 기반으로 관리한다.
// clickCount로 인기 제품을 파악하고 추후 큐레이션 로직에 활용할 수 있다.
@Getter
@Entity
@Table(name = "products")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Product extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String name;

    // 제품 카테고리 — 필터링 및 정렬에 사용된다
    @Column(nullable = false, length = 50)
    private String category;

    @Column(length = 500)
    private String imageUrl;

    @Column(columnDefinition = "TEXT")
    private String description;

    // 가격은 원(KRW) 단위로 저장한다
    @Column
    private Integer price;

    // 외부 구매 링크 — 클릭 시 해당 URL로 이동한다
    @Column(length = 500)
    private String externalUrl;

    // 제품 링크 클릭 횟수 — 인기도 측정과 추후 랭킹에 활용 예정
    @Column(nullable = false)
    private int clickCount;

    @Column(nullable = false)
    private boolean isVisible;

    @Builder
    private Product(String name, String category, String imageUrl, String description,
                    Integer price, String externalUrl) {
        this.name = name;
        this.category = category;
        this.imageUrl = imageUrl;
        this.description = description;
        this.price = price;
        this.externalUrl = externalUrl;
        this.clickCount = 0;
        this.isVisible = true;
    }

    // --- 도메인 메서드 ---

    public void update(String name, String category, String description, Integer price, String externalUrl) {
        this.name = name;
        this.category = category;
        this.description = description;
        this.price = price;
        this.externalUrl = externalUrl;
    }

    // 제품 단건 조회 시 클릭 수를 증가시킨다.
    // 외부 링크 이탈 추적이 아닌 상세 페이지 진입을 기준으로 카운트한다.
    public void incrementClickCount() {
        this.clickCount++;
    }

    public void toggleVisibility(boolean isVisible) {
        this.isVisible = isVisible;
    }
}
