package com.herfree.domain.post.dto.response;

public record PostImageUploadUrlResponse(
        String uploadUrl,
        String imageUrl,
        String objectKey
) {
}
