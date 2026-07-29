package com.herfree.domain.post.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.herfree.global.exception.BusinessException;
import com.herfree.global.exception.ErrorCode;
import com.herfree.global.storage.PostImageStorageService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PostImageServingServiceTest {

    private static final String KEY = "posts/1/123e4567-e89b-12d3-a456-426614174000.png";
    private static final String URI = PostImageStorageService.IMAGE_OBJECT_PATH_PREFIX + KEY;

    @Mock
    private PostImageStorageService postImageStorageService;
    @Mock
    private PostImageAccessService postImageAccessService;

    @InjectMocks
    private PostImageServingService postImageServingService;

    @Test
    void returnsPayloadAfterAuthorizedAccess() {
        given(postImageStorageService.normalizeAndValidateObjectKey(KEY)).willReturn(KEY);
        given(postImageAccessService.check(KEY, 1L))
                .willReturn(new PostImageAccessService.ImageObjectAccess(true, true));
        given(postImageStorageService.fetchImageObject(KEY))
                .willReturn(new PostImageStorageService.ImageObjectPayload(new byte[] {1, 2}, "image/png"));

        var result = postImageServingService.serve(URI, 1L);

        assertThat(result.bytes()).containsExactly(1, 2);
        assertThat(result.contentType()).isEqualTo("image/png");
        assertThat(result.privateScope()).isTrue();
    }

    @Test
    void deniedAccessHidesObjectAndDoesNotFetchStorage() {
        given(postImageStorageService.normalizeAndValidateObjectKey(KEY)).willReturn(KEY);
        given(postImageAccessService.check(KEY, null))
                .willReturn(new PostImageAccessService.ImageObjectAccess(false, true));

        assertThatThrownBy(() -> postImageServingService.serve(URI, null))
                .isInstanceOf(BusinessException.class)
                .extracting(exception -> ((BusinessException) exception).getErrorCode())
                .isEqualTo(ErrorCode.INVALID_IMAGE_URL);

        verify(postImageStorageService, never()).fetchImageObject(KEY);
    }

    @Test
    void malformedUriUsesSameInvalidImageError() {
        assertThatThrownBy(() -> postImageServingService.serve("/api/other-image", 1L))
                .isInstanceOf(BusinessException.class)
                .extracting(exception -> ((BusinessException) exception).getErrorCode())
                .isEqualTo(ErrorCode.INVALID_IMAGE_URL);
    }
}
