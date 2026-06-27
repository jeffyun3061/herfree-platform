package com.herfree.domain.analytics.dto.response;

public record EventCountResponse(
        String eventName,
        long count
) {
}
