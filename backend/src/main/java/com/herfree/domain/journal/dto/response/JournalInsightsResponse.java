package com.herfree.domain.journal.dto.response;

import java.util.List;

public record JournalInsightsResponse(
        int sampleSize,
        boolean sufficientData,
        List<JournalInsightItemResponse> topTriggers,
        List<JournalInsightItemResponse> topProdromalSymptoms,
        String insightMessage,
        List<String> insightLines
) {
    public static JournalInsightsResponse insufficient(int sampleSize, int minSampleSize) {
        return new JournalInsightsResponse(
                sampleSize,
                false,
                List.of(),
                List.of(),
                String.format(
                        "익명 재발 기록 참여자가 %d명이에요. %d명 이상이면 패턴을 보여 드립니다.",
                        sampleSize,
                        minSampleSize),
                List.of(
                        String.format("현재 익명 재발 기록 참여자 %d명 / 최소 %d명", sampleSize, minSampleSize),
                        "회원들의 재발 기록이 더 쌓이면 트리거·전조 증상 패턴을 한 줄로 보여 드려요."
                )
        );
    }

    public static JournalInsightsResponse empty() {
        return insufficient(0, 20);
    }
}
