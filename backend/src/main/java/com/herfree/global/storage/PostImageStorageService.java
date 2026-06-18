package com.herfree.global.storage;

import com.herfree.domain.post.dto.response.PostImageUploadUrlResponse;
import com.herfree.global.config.S3Properties;
import com.herfree.global.exception.BusinessException;
import com.herfree.global.exception.ErrorCode;
import java.time.Duration;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

@Service
@RequiredArgsConstructor
public class PostImageStorageService {

    private static final long MAX_BYTES = 10L * 1024 * 1024;
    private static final Duration PRESIGN_DURATION = Duration.ofMinutes(10);

    private static final Map<String, String> CONTENT_TYPE_TO_EXT = Map.of(
            "image/jpeg", "jpg",
            "image/png", "png",
            "image/webp", "webp"
    );

    private final S3Properties s3Properties;
    private final S3Presigner s3Presigner;

    public PostImageUploadUrlResponse createUploadUrl(Long userId, String contentType, long contentLength) {
        validateImage(contentType, contentLength);

        String extension = CONTENT_TYPE_TO_EXT.get(contentType);
        String objectKey = "posts/" + userId + "/" + UUID.randomUUID() + "." + extension;

        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(s3Properties.bucket())
                .key(objectKey)
                .contentType(contentType)
                .build();

        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(PRESIGN_DURATION)
                .putObjectRequest(putObjectRequest)
                .build();

        PresignedPutObjectRequest presigned = s3Presigner.presignPutObject(presignRequest);

        return new PostImageUploadUrlResponse(
                presigned.url().toString(),
                buildPublicUrl(objectKey),
                objectKey
        );
    }

    private void validateImage(String contentType, long contentLength) {
        if (!StringUtils.hasText(contentType) || !CONTENT_TYPE_TO_EXT.containsKey(contentType)) {
            throw new BusinessException(ErrorCode.INVALID_IMAGE_TYPE);
        }
        if (contentLength <= 0 || contentLength > MAX_BYTES) {
            throw new BusinessException(ErrorCode.INVALID_IMAGE_SIZE);
        }
    }

    private String buildPublicUrl(String objectKey) {
        String base = s3Properties.publicBaseUrl();
        if (StringUtils.hasText(base)) {
            return base.endsWith("/") ? base + objectKey : base + "/" + objectKey;
        }
        return "https://" + s3Properties.bucket() + ".s3." + s3Properties.region() + ".amazonaws.com/" + objectKey;
    }
}
