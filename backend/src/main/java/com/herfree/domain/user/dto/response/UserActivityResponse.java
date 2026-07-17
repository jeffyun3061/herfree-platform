package com.herfree.domain.user.dto.response;

import java.time.Instant;

// 마이페이지 활동 요약 — 내 글·증상 기록·받은 공감 집계
public record UserActivityResponse(
        int totalPosts,
        int symptomPosts,
        long receivedReactions,
        long bookmarkCount,
        Instant lastPostAt,
        Instant memberSince
) {
}
