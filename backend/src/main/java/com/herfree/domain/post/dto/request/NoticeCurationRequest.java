package com.herfree.domain.post.dto.request;

public record NoticeCurationRequest(
        Integer sortOrder,
        Boolean isPinned
) {
}
