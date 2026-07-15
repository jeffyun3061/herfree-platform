package com.herfree.domain.video.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.herfree.domain.board.repository.BoardRepository;
import com.herfree.domain.video.dto.request.VideoCreateRequest;
import com.herfree.domain.video.entity.Video;
import com.herfree.domain.video.repository.VideoRepository;
import com.herfree.global.exception.BusinessException;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("VideoService 입력 검증")
class VideoServiceTest {

    @Mock
    private VideoRepository videoRepository;
    @Mock
    private BoardRepository boardRepository;

    private VideoService videoService;

    @BeforeEach
    void setUp() {
        videoService = new VideoService(videoRepository, boardRepository);
    }

    @Test
    @DisplayName("YouTube처럼 위장한 외부 주소는 저장하지 않는다")
    void createVideo_rejectsUntrustedHost() {
        VideoCreateRequest request = new VideoCreateRequest(
                "영상", "https://evil.example/watch?v=dQw4w9WgXcQ", null, null, null);

        assertThatThrownBy(() -> videoService.createVideo(request))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    @DisplayName("썸네일은 외부 입력 대신 검증된 영상 ID로 생성한다")
    void createVideo_generatesTrustedThumbnail() {
        when(videoRepository.findTopByOrderBySortOrderDesc()).thenReturn(Optional.empty());
        when(videoRepository.save(any(Video.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = videoService.createVideo(new VideoCreateRequest(
                "영상",
                "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                "https://tracker.example/pixel.png",
                "설명",
                null));

        assertThat(response.thumbnailUrl())
                .isEqualTo("https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg");
    }
}
