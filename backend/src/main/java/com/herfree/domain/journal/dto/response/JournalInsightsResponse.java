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
    public static JournalInsightsResponse empty() {
        return new JournalInsightsResponse(
                0,
                false,
                List.of(),
                List.of(),
                "충분한 익명 기록이 쌓이면 패턴 인사이트를 보여 드립니다.",
                List.of("아직 집계할 익명 기록이 충분하지 않습니다.")
        );
    }
}
