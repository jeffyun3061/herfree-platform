package com.herfree.domain.video.dto.request;

public record VideoCurationRequest(
        Integer sortOrder,
        Boolean isFeatured,
        Boolean isVisible
) {
}
