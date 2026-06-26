package com.herfree.global.util;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

/** 커뮤니티 게시글 목록 정렬 — Spring Pageable sort 파라미터를 도메인 정렬로 해석한다 */
public enum PostListSort {
    LATEST,
    POPULAR,
    COMMENTS;

    public static PostListSort from(Pageable pageable) {
        if (pageable == null || pageable.getSort().isEmpty()) {
            return LATEST;
        }
        for (Sort.Order order : pageable.getSort()) {
            return switch (order.getProperty()) {
                case "engagementScore", "viewCount" -> POPULAR;
                case "commentCount" -> COMMENTS;
                default -> LATEST;
            };
        }
        return LATEST;
    }
}
