package com.herfree.domain.post.service;

import com.herfree.global.exception.BusinessException;
import com.herfree.global.exception.ErrorCode;
import com.herfree.global.storage.PostImageStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * 게시글 이미지 프록시 응답을 조립한다.
 * <p>
 * 접근 권한은 {@link PostImageAccessService}에, S3 입출력은
 * {@link PostImageStorageService}에 남기고 이 service는 URI 검증·권한 확인·payload 조합만 맡는다.
 * 허용되지 않은 객체와 잘못된 key는 같은 오류로 처리해 객체 존재 여부를 숨긴다.
 */
@Service
@RequiredArgsConstructor
public class PostImageServingService {

    private final PostImageStorageService postImageStorageService;
    private final PostImageAccessService postImageAccessService;

    public ServedPostImage serve(String requestUri, Long viewerId) {
        String prefix = PostImageStorageService.IMAGE_OBJECT_PATH_PREFIX;
        if (requestUri == null || !requestUri.startsWith(prefix)) {
            throw new BusinessException(ErrorCode.INVALID_IMAGE_URL);
        }

        String objectKey = postImageStorageService.normalizeAndValidateObjectKey(
                requestUri.substring(prefix.length()));
        PostImageAccessService.ImageObjectAccess access = postImageAccessService.check(objectKey, viewerId);
        if (!access.allowed()) {
            throw new BusinessException(ErrorCode.INVALID_IMAGE_URL);
        }

        PostImageStorageService.ImageObjectPayload payload = postImageStorageService.fetchImageObject(objectKey);
        return new ServedPostImage(payload.bytes(), payload.contentType(), access.privateScope());
    }

    public record ServedPostImage(byte[] bytes, String contentType, boolean privateScope) {
    }
}
