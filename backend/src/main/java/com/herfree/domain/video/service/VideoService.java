package com.herfree.domain.video.service;

import com.herfree.domain.board.entity.Board;
import com.herfree.domain.board.repository.BoardRepository;
import com.herfree.domain.video.dto.request.VideoCreateRequest;
import com.herfree.domain.video.dto.request.VideoCurationRequest;
import com.herfree.domain.video.dto.request.VideoUpdateRequest;
import com.herfree.domain.video.dto.request.VideoVisibilityRequest;
import com.herfree.domain.video.dto.response.VideoResponse;
import com.herfree.domain.video.entity.Video;
import com.herfree.domain.video.exception.VideoNotFoundException;
import com.herfree.domain.video.repository.VideoRepository;
import com.herfree.global.util.YoutubeUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class VideoService {

    private final VideoRepository videoRepository;
    private final BoardRepository boardRepository;

    @Transactional(readOnly = true)
    public Page<VideoResponse> getVideos(Pageable pageable) {
        return videoRepository.findPublicVideos(pageable)
                .map(VideoResponse::from);
    }

    @Transactional(readOnly = true)
    public Page<VideoResponse> getAdminVideos(String keyword, Boolean visibleFilter, Pageable pageable) {
        return videoRepository.searchAdminVideos(
                        visibleFilter,
                        StringUtils.hasText(keyword) ? keyword.trim() : null,
                        pageable)
                .map(VideoResponse::from);
    }

    @Transactional(readOnly = true)
    public VideoResponse getVideo(Long videoId) {
        Video video = videoRepository.findByIdAndIsVisibleTrue(videoId)
                .orElseThrow(VideoNotFoundException::new);
        return VideoResponse.from(video);
    }

    @Transactional
    public VideoResponse createVideo(VideoCreateRequest request) {
        // URL에서 videoId를 파싱해 저장한다 — 임베드·썸네일 생성 시 재파싱 비용을 없앤다
        String videoId = YoutubeUtils.extractVideoId(request.youtubeUrl());

        Board relatedBoard = null;
        if (request.relatedBoardId() != null) {
            relatedBoard = boardRepository.findById(request.relatedBoardId()).orElse(null);
        }

        String thumbnailUrl = request.thumbnailUrl();
        if (thumbnailUrl == null || thumbnailUrl.isBlank()) {
            thumbnailUrl = YoutubeUtils.defaultThumbnailUrl(videoId);
        }

        Video video = Video.builder()
                .title(request.title())
                .youtubeUrl(request.youtubeUrl())
                .youtubeVideoId(videoId)
                .thumbnailUrl(thumbnailUrl)
                .description(request.description())
                .relatedBoard(relatedBoard)
                .build();
        video.updateSortOrder(
                videoRepository.findTopByOrderBySortOrderDesc()
                        .map(v -> v.getSortOrder() + 1)
                        .orElse(1));

        return VideoResponse.from(videoRepository.save(video));
    }

    @Transactional
    public VideoResponse updateVideo(Long videoId, VideoUpdateRequest request) {
        Video video = videoRepository.findById(videoId)
                .orElseThrow(VideoNotFoundException::new);

        String newVideoId = YoutubeUtils.extractVideoId(request.youtubeUrl());
        video.update(request.title(), request.youtubeUrl(), newVideoId,
                request.thumbnailUrl(), request.description());

        return VideoResponse.from(video);
    }

    @Transactional
    public VideoResponse updateVisibility(Long videoId, VideoVisibilityRequest request) {
        Video video = videoRepository.findById(videoId)
                .orElseThrow(VideoNotFoundException::new);

        video.updateVisibility(request.isVisible());
        return VideoResponse.from(video);
    }

    @Transactional
    public VideoResponse updateCuration(Long videoId, VideoCurationRequest request) {
        Video video = videoRepository.findById(videoId)
                .orElseThrow(VideoNotFoundException::new);

        if (request.sortOrder() != null) {
            video.updateSortOrder(request.sortOrder());
        }
        if (request.isFeatured() != null) {
            video.setFeatured(request.isFeatured());
        }
        if (request.isVisible() != null) {
            video.updateVisibility(request.isVisible());
        }
        return VideoResponse.from(video);
    }

    @Transactional
    public void deleteVideo(Long videoId) {
        Video video = videoRepository.findById(videoId)
                .orElseThrow(VideoNotFoundException::new);
        videoRepository.delete(video);
    }

}
