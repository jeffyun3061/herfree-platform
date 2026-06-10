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

// 제품 큐레이션 엔티티 — 1차에서는 외부 구매 링크 기반으로 관리한다
@Getter
@Entity
@Table(name = "products")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Product extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, length = 50)
    private String category;

    @Column(length = 500)
    private String imageUrl;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column
    private Integer price;

    @Column(length = 500)
    private String externalUrl;

    // 상세 조회 시마다 +1하여 어떤 제품에 관심이 많은지 운영 지표로 활용한다
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

    public void update(String name, String category, String imageUrl, String description,
                       Integer price, String externalUrl) {
        this.name = name;
        this.category = category;
        this.imageUrl = imageUrl;
        this.description = description;
        this.price = price;
        this.externalUrl = externalUrl;
    }

    // 상세 조회 시 클릭 수를 집계한다 — 운영팀이 인기 제품을 파악하는 데 활용된다
    public void incrementClickCount() {
        this.clickCount++;
    }

    // 노출 여부 변경 — 품절이나 계약 종료된 제품을 임시로 숨길 때 사용한다
    public void updateVisibility(boolean isVisible) {
        this.isVisible = isVisible;
    }
}
