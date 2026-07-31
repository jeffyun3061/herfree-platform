package com.herfree.domain.journal.dto.response;

import java.util.List;

public record JournalInsightsResponse(
        Integer sampleSize,
        boolean sufficientData,
        List<JournalInsightItemResponse> topTriggers,
        List<JournalInsightItemResponse> topProdromalSymptoms,
        String insightMessage,
        List<String> insightLines
) {
    public static JournalInsightsResponse insufficient(int minSampleSize) {
        return new JournalInsightsResponse(
                null,
                false,
                List.of(),
                List.of(),
                String.format("익명 통계는 참여자가 %d명 이상일 때만 공개합니다.", minSampleSize),
                List.of(
                        String.format("최소 공개 기준은 참여자 %d명입니다.", minSampleSize),
                        "기준 미달 시 현재 참여자 수와 개별 항목 수는 공개하지 않습니다."
                )
        );
    }

    public static JournalInsightsResponse unavailable() {
        return new JournalInsightsResponse(
                null,
                false,
                List.of(),
                List.of(),
                "현재는 안전한 범위에서 익명 통계를 제공할 수 없습니다.",
                List.of("표본을 왜곡하지 않도록 이번 통계 제공을 중단했습니다.")
        );
    }

    public static JournalInsightsResponse empty() {
        return insufficient(20);
    }
}
