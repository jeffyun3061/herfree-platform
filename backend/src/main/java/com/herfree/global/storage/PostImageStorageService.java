package com.herfree.global.storage;

import com.herfree.domain.post.dto.response.PostImageUploadUrlResponse;
import com.herfree.global.config.S3Properties;
import com.herfree.global.exception.BusinessException;
import com.herfree.global.exception.ErrorCode;
import java.io.IOException;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import software.amazon.awssdk.core.exception.SdkException;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectResponse;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

@Service
@RequiredArgsConstructor
@Slf4j
public class PostImageStorageService {

    public static final String IMAGE_OBJECT_PATH_PREFIX = "/api/posts/images/object/";

    private static final long MAX_BYTES = 10L * 1024 * 1024;
    private static final Duration PRESIGN_DURATION = Duration.ofMinutes(10);

    private static final Map<String, String> CONTENT_TYPE_TO_EXT = Map.of(
            "image/jpeg", "jpg",
            "image/png", "png",
            "image/webp", "webp"
    );

    private final S3Properties s3Properties;
    private final S3Client s3Client;
    private final S3Presigner s3Presigner;

    /** 브라우저 → API → S3 (로컬·운영 동일) */
    public String uploadImage(Long userId, byte[] data, String contentType) {
        assertS3Configured();
        validateImage(contentType, data.length);

        String extension = CONTENT_TYPE_TO_EXT.get(contentType);
        String objectKey = "posts/" + userId + "/" + UUID.randomUUID() + "." + extension;

        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(s3Properties.bucket())
                .key(objectKey)
                .contentType(contentType)
                .contentLength((long) data.length)
                .build();

        try {
            s3Client.putObject(putObjectRequest, RequestBody.fromBytes(data));
        } catch (SdkException ex) {
            throw mapS3Failure(ex, "upload");
        }

        return buildImageAccessUrl(objectKey);
    }

    public PostImageUploadUrlResponse createUploadUrl(Long userId, String contentType, long contentLength) {
        assertS3Configured();
        validateImage(contentType, contentLength);

        String extension = CONTENT_TYPE_TO_EXT.get(contentType);
        String objectKey = "posts/" + userId + "/" + UUID.randomUUID() + "." + extension;

        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(s3Properties.bucket())
                .key(objectKey)
                .contentType(contentType)
                .contentLength(contentLength)
                .build();

        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(PRESIGN_DURATION)
                .putObjectRequest(putObjectRequest)
                .build();

        PresignedPutObjectRequest presigned = presignPutObject(presignRequest);

        return new PostImageUploadUrlResponse(
                presigned.url().toString(),
                buildImageAccessUrl(objectKey)
        );
    }

    /** DB에 저장된 URL(S3 직링크 포함)을 브라우저 표시용 API 경로로 변환 */
    public String toDisplayUrl(String storedUrl) {
        if (!StringUtils.hasText(storedUrl)) {
            return storedUrl;
        }
        String trimmed = storedUrl.trim();
        if (trimmed.startsWith(IMAGE_OBJECT_PATH_PREFIX)) {
            return trimmed;
        }
        String objectKey = extractObjectKey(trimmed);
        return buildImageAccessUrl(objectKey);
    }

    /** URL 인코딩·선행 슬래시를 정리하고 허용 형식(posts/{userId}/UUID.ext)인지 검증한 key를 돌려준다 */
    public String normalizeAndValidateObjectKey(String objectKey) {
        String normalized = normalizeObjectKey(objectKey);
        assertValidObjectKey(normalized);
        return normalized;
    }

    public ImageObjectPayload fetchImageObject(String objectKey) {
        assertS3Configured();
        String normalizedKey = normalizeObjectKey(objectKey);
        assertValidObjectKey(normalizedKey);

        HeadObjectRequest headRequest = HeadObjectRequest.builder()
                .bucket(s3Properties.bucket())
                .key(normalizedKey)
                .build();

        try {
            HeadObjectResponse head = s3Client.headObject(headRequest);
            validateImage(contentTypeOrFallback(head.contentType(), normalizedKey), head.contentLength());

            GetObjectRequest getRequest = GetObjectRequest.builder()
                    .bucket(s3Properties.bucket())
                    .key(normalizedKey)
                    .build();

            try (var response = s3Client.getObject(getRequest)) {
                byte[] bytes = response.readNBytes((int) MAX_BYTES + 1);
                if (bytes.length > MAX_BYTES) {
                    throw new BusinessException(ErrorCode.INVALID_IMAGE_SIZE);
                }
                String contentType = contentTypeOrFallback(response.response().contentType(), normalizedKey);
                validateImage(contentType, bytes.length);
                return new ImageObjectPayload(bytes, contentType);
            }
        } catch (IOException ex) {
            throw new BusinessException(ErrorCode.S3_UPLOAD_FAILED);
        } catch (SdkException ex) {
            throw mapS3Failure(ex, "get");
        }
    }

    public record ImageObjectPayload(byte[] bytes, String contentType) {}

    private PresignedPutObjectRequest presignPutObject(PutObjectPresignRequest presignRequest) {
        try {
            return s3Presigner.presignPutObject(presignRequest);
        } catch (SdkException ex) {
            throw mapS3Failure(ex, "presign");
        }
    }

    public void assertImageUrlAllowed(Long userId, String imageUrl) {
        if (!StringUtils.hasText(imageUrl)) {
            return;
        }

        String trimmed = imageUrl.trim();
        if (trimmed.startsWith(IMAGE_OBJECT_PATH_PREFIX)) {
            String objectKey = trimmed.substring(IMAGE_OBJECT_PATH_PREFIX.length());
            assertObjectKeyOwnedByUser(objectKey, userId);
            return;
        }

        URI uri;
        try {
            uri = URI.create(trimmed);
        } catch (IllegalArgumentException ex) {
            throw new BusinessException(ErrorCode.INVALID_IMAGE_URL);
        }

        if (!"https".equalsIgnoreCase(uri.getScheme())) {
            throw new BusinessException(ErrorCode.INVALID_IMAGE_URL);
        }

        if (!isAllowedImageHost(uri.getHost())) {
            throw new BusinessException(ErrorCode.INVALID_IMAGE_URL);
        }

        String path = uri.getPath();
        String requiredPrefix = "/posts/" + userId + "/";
        if (path == null || !path.startsWith(requiredPrefix)) {
            throw new BusinessException(ErrorCode.INVALID_IMAGE_URL);
        }
    }

    private void assertS3Configured() {
        if (!StringUtils.hasText(s3Properties.bucket()) || !StringUtils.hasText(s3Properties.region())) {
            throw new BusinessException(ErrorCode.S3_NOT_CONFIGURED);
        }
    }

    private BusinessException mapS3Failure(SdkException ex, String action) {
        if (ex instanceof S3Exception s3Ex && s3Ex.awsErrorDetails() != null) {
            String code = s3Ex.awsErrorDetails().errorCode();
            log.warn("S3 {} failed (errorCode={})", action, code);
            return switch (code) {
                case "NoSuchBucket" -> new BusinessException(ErrorCode.S3_BUCKET_NOT_FOUND);
                case "AccessDenied" -> new BusinessException(ErrorCode.S3_ACCESS_DENIED);
                case "NoSuchKey" -> new BusinessException(ErrorCode.INVALID_IMAGE_URL);
                case "InvalidAccessKeyId" -> new BusinessException(ErrorCode.S3_NOT_CONFIGURED);
                default -> new BusinessException(ErrorCode.S3_UPLOAD_FAILED);
            };
        }
        log.warn("S3 {} failed (failureType={})", action, ex.getClass().getSimpleName());
        return new BusinessException(ErrorCode.S3_UPLOAD_FAILED);
    }

    private void validateImage(String contentType, long contentLength) {
        if (!StringUtils.hasText(contentType) || !CONTENT_TYPE_TO_EXT.containsKey(contentType)) {
            throw new BusinessException(ErrorCode.INVALID_IMAGE_TYPE);
        }
        if (contentLength <= 0 || contentLength > MAX_BYTES) {
            throw new BusinessException(ErrorCode.INVALID_IMAGE_SIZE);
        }
    }

    private boolean isAllowedImageHost(String host) {
        if (!StringUtils.hasText(host)) {
            return false;
        }
        return allowedImageHosts().stream().anyMatch(allowed -> allowed.equalsIgnoreCase(host));
    }

    private Set<String> allowedImageHosts() {
        if (StringUtils.hasText(s3Properties.publicBaseUrl())) {
            try {
                String cdnHost = URI.create(s3Properties.publicBaseUrl().trim()).getHost();
                if (StringUtils.hasText(cdnHost)) {
                    return Set.of(cdnHost);
                }
            } catch (IllegalArgumentException ignored) {
                // fall through
            }
        }

        String bucket = s3Properties.bucket();
        String region = s3Properties.region();
        return Set.of(
                bucket + ".s3." + region + ".amazonaws.com",
                bucket + ".s3.amazonaws.com"
        );
    }

    private String buildImageAccessUrl(String objectKey) {
        // 비공개 게시판 이미지도 같은 버킷을 사용하므로 항상 권한 판정 프록시를 거친다.
        return IMAGE_OBJECT_PATH_PREFIX + objectKey;
    }

    private String extractObjectKey(String imageUrl) {
        if (imageUrl.startsWith(IMAGE_OBJECT_PATH_PREFIX)) {
            return imageUrl.substring(IMAGE_OBJECT_PATH_PREFIX.length());
        }
        try {
            URI uri = URI.create(imageUrl);
            String path = uri.getPath();
            if (!StringUtils.hasText(path) || path.length() <= 1) {
                throw new BusinessException(ErrorCode.INVALID_IMAGE_URL);
            }
            return path.startsWith("/") ? path.substring(1) : path;
        } catch (IllegalArgumentException ex) {
            throw new BusinessException(ErrorCode.INVALID_IMAGE_URL);
        }
    }

    private String normalizeObjectKey(String objectKey) {
        String decoded = URLDecoder.decode(objectKey, StandardCharsets.UTF_8);
        while (decoded.startsWith("/")) {
            decoded = decoded.substring(1);
        }
        return decoded;
    }

    private void assertValidObjectKey(String objectKey) {
        if (!objectKey.matches("posts/\\d+/[0-9a-fA-F-]{36}\\.(jpg|png|webp)")) {
            throw new BusinessException(ErrorCode.INVALID_IMAGE_URL);
        }
    }

    private void assertObjectKeyOwnedByUser(String objectKey, Long userId) {
        String normalized = normalizeObjectKey(objectKey);
        assertValidObjectKey(normalized);
        String requiredPrefix = "posts/" + userId + "/";
        if (!normalized.startsWith(requiredPrefix)) {
            throw new BusinessException(ErrorCode.INVALID_IMAGE_URL);
        }
    }

    private String contentTypeFromKey(String objectKey) {
        String lower = objectKey.toLowerCase();
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
            return "image/jpeg";
        }
        if (lower.endsWith(".png")) {
            return "image/png";
        }
        if (lower.endsWith(".webp")) {
            return "image/webp";
        }
        return "application/octet-stream";
    }

    /** 게시글 삭제·회원 탈퇴 시 DB 연결뿐 아니라 S3 원본도 함께 파기한다. */
    public void deleteImage(String imageUrl) {
        if (!StringUtils.hasText(imageUrl)) {
            return;
        }
        assertS3Configured();
        String objectKey = normalizeObjectKey(extractObjectKey(imageUrl.trim()));
        assertValidObjectKey(objectKey);

        try {
            s3Client.deleteObject(DeleteObjectRequest.builder()
                    .bucket(s3Properties.bucket())
                    .key(objectKey)
                    .build());
        } catch (SdkException ex) {
            log.warn("S3 delete failed (failureType={})", ex.getClass().getSimpleName());
            throw new BusinessException(ErrorCode.S3_DELETE_FAILED);
        }
    }

    public void deleteManagedImageIfPresent(String imageUrl) {
        if (!StringUtils.hasText(imageUrl)) {
            return;
        }
        String trimmed = imageUrl.trim();
        if (trimmed.startsWith(IMAGE_OBJECT_PATH_PREFIX)) {
            deleteImage(trimmed);
            return;
        }
        try {
            URI uri = URI.create(trimmed);
            if ("https".equalsIgnoreCase(uri.getScheme())
                    && isAllowedImageHost(uri.getHost())
                    && uri.getPath() != null
                    && uri.getPath().startsWith("/posts/")) {
                deleteImage(trimmed);
            }
        } catch (IllegalArgumentException ignored) {
            // 기존 정적 이미지 경로는 S3 관리 대상이 아니므로 삭제하지 않는다.
        }
    }

    private String contentTypeOrFallback(String contentType, String objectKey) {
        return StringUtils.hasText(contentType) ? contentType : contentTypeFromKey(objectKey);
    }

    public String resolveContentType(String rawContentType, String filename) {
        if (StringUtils.hasText(rawContentType) && CONTENT_TYPE_TO_EXT.containsKey(rawContentType)) {
            return rawContentType;
        }
        if (!StringUtils.hasText(filename)) {
            throw new BusinessException(ErrorCode.INVALID_IMAGE_TYPE);
        }
        String lower = filename.toLowerCase();
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
            return "image/jpeg";
        }
        if (lower.endsWith(".png")) {
            return "image/png";
        }
        if (lower.endsWith(".webp")) {
            return "image/webp";
        }
        throw new BusinessException(ErrorCode.INVALID_IMAGE_TYPE);
    }
}
