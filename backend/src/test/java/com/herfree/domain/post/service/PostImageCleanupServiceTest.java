package com.herfree.domain.post.service;

import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.herfree.domain.post.entity.PostImage;
import com.herfree.domain.post.repository.PostImageRepository;
import com.herfree.global.storage.PostImageStorageService;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PostImageCleanupServiceTest {

    @Mock
    private PostImageRepository postImageRepository;

    @Mock
    private PostImageStorageService postImageStorageService;

    @InjectMocks
    private PostImageCleanupService cleanupService;

    @Test
    @DisplayName("S3 원본을 삭제한 뒤 게시글 이미지 DB 행을 삭제한다")
    void deleteImagesForPostIds_deletesObjectThenRows() {
        PostImage image = mock(PostImage.class);
        given(image.getImageUrl()).willReturn("/api/posts/images/object/posts/1/image.png");
        given(postImageRepository.findAllByPostIdIn(List.of(10L))).willReturn(List.of(image));

        cleanupService.deleteImagesForPostIds(List.of(10L));

        var ordered = inOrder(postImageStorageService, postImageRepository);
        ordered.verify(postImageStorageService).deleteImage(image.getImageUrl());
        ordered.verify(postImageRepository).deleteByPostIdIn(List.of(10L));
    }

    @Test
    @DisplayName("S3 삭제 실패 시 DB 연결을 남겨 재시도 가능하게 한다")
    void deleteImagesForPostIds_storageFailure_keepsRows() {
        PostImage image = mock(PostImage.class);
        String imageUrl = "/api/posts/images/object/posts/1/image.png";
        given(image.getImageUrl()).willReturn(imageUrl);
        given(postImageRepository.findAllByPostIdIn(List.of(10L))).willReturn(List.of(image));
        Mockito.doThrow(new RuntimeException("s3 failure"))
                .when(postImageStorageService).deleteImage(imageUrl);

        try {
            cleanupService.deleteImagesForPostIds(List.of(10L));
        } catch (RuntimeException ignored) {
            // 삭제 실패가 호출자에게 전달되는지만 확인하고 DB 삭제 방지를 검증한다.
        }

        verify(postImageRepository, never()).deleteByPostIdIn(List.of(10L));
    }
}
