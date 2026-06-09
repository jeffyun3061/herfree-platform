package com.herfree.domain.reaction.entity;

// 반응 종류 — 민감 질환 커뮤니티 특성에 맞춘 감정 표현 타입을 정의한다.
// 단순 좋아요보다 세분화된 반응으로 사용자 간 공감대를 높이는 것이 목적이다.
public enum ReactionType {

    // 공감해요 — 같은 감정을 느끼는 사용자 표현
    EMPATHY,

    // 위로해요 — 힘든 상황에 처한 작성자를 응원하는 표현
    COMFORT,

    // 도움이 돼요 — 정보성 게시글에 유용함을 표현
    HELPFUL,

    // 응원해요 — 치료 과정을 함께 응원하는 표현
    SUPPORT,

    // 저도 같아요 — 동일한 경험을 가진 사용자가 공감을 표현
    SAME
}
