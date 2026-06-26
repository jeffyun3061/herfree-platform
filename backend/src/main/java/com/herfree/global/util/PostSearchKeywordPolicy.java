package com.herfree.global.util;

import com.herfree.global.exception.BusinessException;
import com.herfree.global.exception.ErrorCode;
import org.springframework.util.StringUtils;

public final class PostSearchKeywordPolicy {

    public static final int MIN_LENGTH = 2;

    private PostSearchKeywordPolicy() {
    }

    public static String normalizeOrNull(String keyword) {
        if (!StringUtils.hasText(keyword)) {
            return null;
        }
        return keyword.trim();
    }

    /** 검색어가 있으면 최소 2글자 — 미만이면 예외, 없으면 null */
    public static String normalizeForSearch(String keyword) {
        String trimmed = normalizeOrNull(keyword);
        if (trimmed == null) {
            return null;
        }
        if (trimmed.length() < MIN_LENGTH) {
            throw new BusinessException(ErrorCode.SEARCH_KEYWORD_TOO_SHORT);
        }
        return trimmed;
    }
}
