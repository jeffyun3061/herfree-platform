package com.herfree.domain.content.dto.request;

public record ContentCurationRequest(
        Integer sortOrder,
        Boolean isPinned
) {
}
