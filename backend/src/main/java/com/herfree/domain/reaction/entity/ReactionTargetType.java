package com.herfree.domain.reaction.entity;

// 반응 대상 타입 — 게시글과 댓글 모두에 반응을 달 수 있도록 다형적으로 설계한다.
// 단일 reactions 테이블이 여러 대상을 처리하므로 target_type으로 어떤 리소스인지 구분한다.
public enum ReactionTargetType {

    POST,

    COMMENT
}
