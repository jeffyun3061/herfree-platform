package com.herfree.domain.journal.dto.response;

/** 홈 화면에 표시하는 공개 서비스 이용 통계다. 건강정보·개인기록은 포함하지 않는다. */
public record JournalPublicHomeStatsResponse(
        long activeMemberCount,
        long postsToday
) {}
