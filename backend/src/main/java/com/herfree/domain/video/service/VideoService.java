package com.herfree.domain.video.service;

import com.herfree.domain.board.entity.Board;
import com.herfree.domain.board.repository.BoardRepository;
import com.herfree.domain.video.dto.request.VideoCreateRequest;
import com.herfree.domain.video.dto.request.VideoUpdateRequest;
import com.herfree.domain.video.dto.request.VideoVisibilityRequest;
import com.herfree.domain.video.dto.response.VideoResponse;
import com.herfree.domain.video.entity.Video;
import com.herfree.domain.video.exception.VideoNotFoundException;
import com.herfree.domain.video.repository.VideoRepository;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class VideoService {

    private final VideoRepository videoRepository;
    private final BoardRepository boardRepository;

    @Transactional(readOnly = true)
    public Page<VideoResponse> getVideos(Pageable pageable) {
        return videoRepository.findByIsVisibleTrueOrderByCreatedAtDesc(pageable)
                .map(VideoResponse::from);
    }

    @Transactional(readOnly = true)
    public VideoResponse getVideo(Long videoId) {
        Video video = videoRepository.findByIdAndIsVisibleTrue(videoId)
                .orElseThrow(VideoNotFoundException::new);
        return VideoResponse.from(video);
    }

    // 영상 등록 — URL에서 videoId를 자동 추출하고 썸네일 URL을 생성한다.
    @Transactional
    public VideoResponse createVideo(VideoCreateRequest request) {
        String videoId = extractYoutubeVideoId(request.youtubeUrl());
        // 유튜브 표준 썸네일 URL 패턴으로 thumbnailUrl을 자동 생성한다
        String thumbnailUrl = "https://img.youtube.com/vi/" + videoId + "/hqdefault.jpg";

        Board relatedBoard = null;
        if (request.relatedBoardId() != null) {
            relatedBoard = boardRepository.findById(request.relatedBoardId()).orElse(null);
        }

        Video video = Video.builder()
                .title(request.title())
                .youtubeUrl(request.youtubeUrl())
                .youtubeVideoId(videoId)
                .thumbnailUrl(thumbnailUrl)
                .description(request.description())
                .relatedBoard(relatedBoard)
                .build();

        videoRepository.save(video);
        return VideoResponse.from(video);
    }

    @Transactional
    public VideoResponse updateVideo(Long videoId, VideoUpdateRequest request) {
        Video video = videoRepository.findById(videoId)
                .orElseThrow(VideoNotFoundException::new);
        video.update(request.title(), request.description());
        return VideoResponse.from(video);
    }

    @Transactional
    public void updateVisibility(Long videoId, VideoVisibilityRequest request) {
        Video video = videoRepository.findById(videoId)
                .orElseThrow(VideoNotFoundException::new);
        video.toggleVisibility(request.isVisible());
    }

    // 유튜브 URL에서 videoId를 추출한다.
    // 지원 포맷:
    //   - https://youtu.be/VIDEO_ID
    //   - https://www.youtube.com/watch?v=VIDEO_ID
    //   - https://www.youtube.com/embed/VIDEO_ID
    private String extractYoutubeVideoId(String url) {
        String[] patterns = {
                "youtu\\.be/([^?&\\s]+)",
                "[?&]v=([^?&\\s]+)",
                "/embed/([^?&\\s]+)"
        };

        for (String patternStr : patterns) {
            Matcher matcher = Pattern.compile(patternStr).matcher(url);
            if (matcher.find()) {
                return matcher.group(1);
            }
        }

        // 어떤 패턴에도 맞지 않으면 URL 자체를 videoId로 사용한다(비정상 입력 방어)
        return url;
    }
}
