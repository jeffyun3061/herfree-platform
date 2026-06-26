package com.herfree.global.util;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.herfree.global.exception.BusinessException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("PostSearchKeywordPolicy")
class PostSearchKeywordPolicyTest {

    @Test
    @DisplayName("빈 검색어는 null을 반환한다")
    void normalizeForSearch_blank_returnsNull() {
        assertThat(PostSearchKeywordPolicy.normalizeForSearch(null)).isNull();
        assertThat(PostSearchKeywordPolicy.normalizeForSearch("  ")).isNull();
    }

    @Test
    @DisplayName("두 글자 이상 검색어는 trim 후 반환한다")
    void normalizeForSearch_valid_returnsTrimmed() {
        assertThat(PostSearchKeywordPolicy.normalizeForSearch("  재발  ")).isEqualTo("재발");
    }

    @Test
    @DisplayName("한 글자 검색어는 예외를 던진다")
    void normalizeForSearch_tooShort_throws() {
        assertThatThrownBy(() -> PostSearchKeywordPolicy.normalizeForSearch("재"))
                .isInstanceOf(BusinessException.class);
    }
}
