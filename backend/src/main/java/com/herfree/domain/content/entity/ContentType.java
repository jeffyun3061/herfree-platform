package com.herfree.domain.content.entity;

// 콘텐츠 작성자 유형 — 작성자 권한에 따라 콘텐츠를 구분한다.
// 클라이언트가 콘텐츠 유형에 따라 뱃지나 레이아웃을 다르게 표시할 수 있다.
public enum ContentType {

    // 유튜버·인플루언서가 작성한 콘텐츠
    CREATOR,

    // 의사·전문가가 작성한 신뢰도 높은 콘텐츠
    DOCTOR,

    // 운영팀이 작성한 공식 콘텐츠
    ADMIN
}
