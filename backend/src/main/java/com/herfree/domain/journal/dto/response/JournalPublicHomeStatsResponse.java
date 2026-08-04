package com.herfree.domain.journal.dto.response;

/** 홈 화면에 표시하는 공개 서비스 이용 통계다. */
/**
 * Public home stats intentionally expose no participant counts.
 * The endpoint remains for compatibility and returns an empty object.
 */
public record JournalPublicHomeStatsResponse() {}
