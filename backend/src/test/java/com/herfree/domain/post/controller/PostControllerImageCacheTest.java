package com.herfree.domain.post.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;

import com.herfree.domain.post.service.PostImageAccessService;
import com.herfree.domain.post.service.PostService;
import com.herfree.global.storage.PostImageStorageService;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;

class PostControllerImageCacheTest {

    private static final String KEY = "posts/1/123e4567-e89b-12d3-a456-426614174000.png";

    private final PostService postService = mock(PostService.class);
    private final PostImageStorageService storage = mock(PostImageStorageService.class);
    private final PostImageAccessService accessService = mock(PostImageAccessService.class);
    private final PostController controller = new PostController(postService, storage, accessService);

    @Test
    void privateImageResponseIsPrivateAndNoStore() {
        HttpServletRequest request = request();
        given(storage.normalizeAndValidateObjectKey(KEY)).willReturn(KEY);
        given(accessService.check(KEY, 1L))
                .willReturn(new PostImageAccessService.ImageObjectAccess(true, true));
        given(storage.fetchImageObject(KEY))
                .willReturn(new PostImageStorageService.ImageObjectPayload(new byte[] {1}, "image/png"));

        var response = controller.serveImage(1L, request);

        assertThat(response.getHeaders().getCacheControl()).contains("private");
        assertThat(response.getHeaders().getCacheControl()).contains("no-store");
    }

    @Test
    void publicImageResponseRemainsPublicCacheable() {
        HttpServletRequest request = request();
        given(storage.normalizeAndValidateObjectKey(KEY)).willReturn(KEY);
        given(accessService.check(KEY, null))
                .willReturn(new PostImageAccessService.ImageObjectAccess(true, false));
        given(storage.fetchImageObject(KEY))
                .willReturn(new PostImageStorageService.ImageObjectPayload(new byte[] {1}, "image/png"));

        var response = controller.serveImage(null, request);

        assertThat(response.getHeaders().getCacheControl()).contains("public");
        assertThat(response.getHeaders().getCacheControl()).contains("max-age=86400");
    }

    private HttpServletRequest request() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        given(request.getRequestURI()).willReturn(
                PostImageStorageService.IMAGE_OBJECT_PATH_PREFIX + KEY);
        return request;
    }
}
