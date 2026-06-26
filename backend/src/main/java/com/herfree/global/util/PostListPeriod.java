package com.herfree.global.util;

import java.time.LocalDateTime;
import org.springframework.util.StringUtils;

/** 커뮤니티 인기·댓글 정렬 기간 — 주간(7일)이 기본이다 */
public enum PostListPeriod {
    WEEK,
    ALL;

    private static final int WEEK_DAYS = 7;

    public static PostListPeriod from(String raw) {
        if (StringUtils.hasText(raw) && "all".equalsIgnoreCase(raw.trim())) {
            return ALL;
        }
        return WEEK;
    }

    public LocalDateTime weekSince() {
        return LocalDateTime.now().minusDays(WEEK_DAYS);
    }
}
