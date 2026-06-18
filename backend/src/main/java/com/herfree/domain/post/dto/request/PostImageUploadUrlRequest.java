package com.herfree.domain.post.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PostImageUploadUrlRequest(
        @NotBlank(message = "Content-Type은 필수입니다.")
        String contentType,

        @NotNull(message = "파일 크기는 필수입니다.")
        @Min(value = 1, message = "파일 크기가 올바르지 않습니다.")
        @Max(value = 10485760, message = "이미지는 10MB 이하만 업로드할 수 있습니다.")
        Long contentLength
) {
}
