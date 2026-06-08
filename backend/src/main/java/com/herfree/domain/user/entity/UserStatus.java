package com.herfree.domain.user.entity;

// 계정 상태를 나타내는 enum
// 물리 삭제 대신 status 기반 soft delete를 사용하는 이유:
// 탈퇴 회원이 작성한 게시글·댓글은 익명 처리 후 유지해야 커뮤니티 맥락이 보존된다.
// 또한 계정 정지(SUSPENDED) 상태를 별도로 표현해 복구 가능성을 열어둔다.
public enum UserStatus {

    // 정상 활성 상태
    ACTIVE,

    // 관리자에 의해 일시 정지된 계정 — 로그인 불가, 복구 가능
    SUSPENDED,

    // 회원이 직접 탈퇴하거나 장기 미사용으로 삭제 처리된 계정
    // DB 레코드는 남기되 모든 API 접근을 차단한다
    DELETED
}
