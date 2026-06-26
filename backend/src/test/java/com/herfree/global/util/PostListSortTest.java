package com.herfree.global.util;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

class PostListSortTest {

    @Test
    @DisplayName("sort 파라미터 없으면 최신순")
    void from_emptySort_returnsLatest() {
        assertThat(PostListSort.from(PageRequest.of(0, 20))).isEqualTo(PostListSort.LATEST);
    }

    @Test
    @DisplayName("engagementScore·viewCount 정렬은 인기순")
    void from_engagementScore_returnsPopular() {
        PageRequest pageable = PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "engagementScore"));
        assertThat(PostListSort.from(pageable)).isEqualTo(PostListSort.POPULAR);
    }

    @Test
    @DisplayName("commentCount 정렬은 댓글순")
    void from_commentCount_returnsComments() {
        PageRequest pageable = PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "commentCount"));
        assertThat(PostListSort.from(pageable)).isEqualTo(PostListSort.COMMENTS);
    }
}
