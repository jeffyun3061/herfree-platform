package com.herfree.domain.board.entity;

import com.herfree.global.common.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 게시판 정보 엔티티
// 게시판은 코드가 아닌 DB 데이터로 관리하여 런타임에 관리자가 변경할 수 있도록 설계한다.
// sort_order로 노출 순서를 유연하게 조정할 수 있다.
@Getter
@Entity
@Table(name = "boards")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Board extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 500)
    private String description;

    // 게시판 종류를 코드로 관리하는 이유:
    // 비즈니스 로직에서 게시판 종류를 분기할 때 문자열보다 훨씬 안전하고 변경에 강하다
    @Column(nullable = false, length = 50, unique = true)
    private String boardType;

    // 노출 순서 — 숫자가 낮을수록 먼저 표시된다
    @Column(nullable = false)
    private int sortOrder;

    // 비활성화된 게시판은 API 응답에서 제외하여 사용자에게 노출되지 않는다
    @Column(nullable = false)
    private boolean isActive;
}
