package com.herfree.domain.post.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;

import com.herfree.domain.post.service.PostBookmarkService;
import com.herfree.domain.post.service.PostImageServingService;
import com.herfree.domain.post.service.PostService;
import com.herfree.global.storage.PostImageStorageService;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;

class PostControllerImageCacheTest {

    private final PostService postService = mock(PostService.class);
    private final PostBookmarkService postBookmarkService = mock(PostBookmarkService.class);
    private final PostImageStorageService storage = mock(PostImageStorageService.class);
    private final PostImageServingService imageServingService = mock(PostImageServingService.class);
    private final PostController controller = new PostController(
            postService,
            postBookmarkService,
            storage,
            imageServingService
    );

    @Test
    void privateImageResponseIsPrivateAndNoStore() {
        HttpServletRequest request = request();
        given(imageServingService.serve(request().getRequestURI(), 1L))
                .willReturn(new PostImageServingService.ServedPostImage(new byte[] {1}, "image/png", true));

        var response = controller.serveImage(1L, request);

        assertThat(response.getHeaders().getCacheControl()).contains("private");
        assertThat(response.getHeaders().getCacheControl()).contains("no-store");
    }

    @Test
    void publicImageResponseRemainsPublicCacheable() {
        HttpServletRequest request = request();
        given(imageServingService.serve(request().getRequestURI(), null))
                .willReturn(new PostImageServingService.ServedPostImage(new byte[] {1}, "image/png", false));

        var response = controller.serveImage(null, request);

        assertThat(response.getHeaders().getCacheControl()).contains("public");
        assertThat(response.getHeaders().getCacheControl()).contains("max-age=86400");
    }

    private HttpServletRequest request() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        given(request.getRequestURI()).willReturn(
                PostImageStorageService.IMAGE_OBJECT_PATH_PREFIX
                        + "posts/1/123e4567-e89b-12d3-a456-426614174000.png");
        return request;
    }
}
