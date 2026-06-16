package com.herfree.domain.user.entity;

// 사용자 권한 역할을 표현하는 enum
// 1차 MVP는 USER와 ADMIN만 실제로 사용하지만,
// 나머지는 추후 크리에이터·의사·모더레이터 기능 확장 시 즉시 활성화할 수 있도록 미리 정의해 둔다.
public enum UserRole {

    // 일반 회원 — 게시글 작성·댓글·반응 가능
    USER,

    // 콘텐츠 크리에이터 — 정보글 작성 권한 (1.5차 확장 예정)
    CREATOR,

    // 의사·전문가 — 전문가 정보방 콘텐츠 작성 권한 (2차 확장 예정)
    DOCTOR,

    // 모더레이터 — 신고 처리·콘텐츠 숨김 권한 (2차 확장 예정)
    MODERATOR,

    // 운영 관리자 — 콘텐츠·회원 상태·집계 통계
    ADMIN,

    // 최고 관리자 — 권한 부여/회수 (bootstrap 또는 SUPER_ADMIN만 승격)
    SUPER_ADMIN
}
