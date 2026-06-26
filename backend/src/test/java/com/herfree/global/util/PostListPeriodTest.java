package com.herfree.global.util;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class PostListPeriodTest {

    @Test
    @DisplayName("period 미지정·week는 주간")
    void from_defaultsToWeek() {
        assertThat(PostListPeriod.from(null)).isEqualTo(PostListPeriod.WEEK);
        assertThat(PostListPeriod.from("week")).isEqualTo(PostListPeriod.WEEK);
    }

    @Test
    @DisplayName("period=all은 전체 기간")
    void from_all() {
        assertThat(PostListPeriod.from("all")).isEqualTo(PostListPeriod.ALL);
    }
}
