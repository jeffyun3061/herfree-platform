package com.herfree.domain.video.service;

import com.herfree.domain.board.entity.Board;
import com.herfree.domain.board.exception.BoardNotFoundException;
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
import com.herfree.global.exception.BusinessException;
import com.herfree.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * YouTube URL 큐레이션 CMS.
 * <p>
 * 영상 파일 직접 업로드는 MVP 범위 밖. 공개 목록은 노출·순서 기준 상위 N건, 관리자는 전체·숨김 복구.
 */
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
        if (!StringUtils.hasText(videoId)) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "올바른 YouTube HTTPS 주소를 입력해 주세요.");
        }

        Board relatedBoard = null;
        if (request.relatedBoardId() != null) {
            relatedBoard = boardRepository.findById(request.relatedBoardId())
                    .orElseThrow(BoardNotFoundException::new);
        }

        // 외부 추적 이미지가 저장되지 않도록 썸네일은 검증된 영상 ID로만 생성한다.
        String thumbnailUrl = YoutubeUtils.defaultThumbnailUrl(videoId);

        Video video = Video.builder()
                .title(request.title().trim())
                .youtubeUrl(request.youtubeUrl().trim())
                .youtubeVideoId(videoId)
                .thumbnailUrl(thumbnailUrl)
                .description(normalizeOptionalText(request.description()))
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
        if (!StringUtils.hasText(newVideoId)) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "올바른 YouTube HTTPS 주소를 입력해 주세요.");
        }
        video.update(request.title().trim(), request.youtubeUrl().trim(), newVideoId,
                YoutubeUtils.defaultThumbnailUrl(newVideoId), normalizeOptionalText(request.description()));

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

    private String normalizeOptionalText(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

}
