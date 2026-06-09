package com.herfree.domain.video.controller;

import com.herfree.domain.video.dto.response.VideoResponse;
import com.herfree.domain.video.service.VideoService;
import com.herfree.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// 영상 조회 API — 비로그인 접근 허용
@RestController
@RequestMapping("/api/videos")
@RequiredArgsConstructor
public class VideoController {

    private final VideoService videoService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<VideoResponse>>> getVideos(
            @PageableDefault(size = 10) Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.success(videoService.getVideos(pageable)));
    }

    @GetMapping("/{videoId}")
    public ResponseEntity<ApiResponse<VideoResponse>> getVideo(@PathVariable Long videoId) {
        return ResponseEntity.ok(ApiResponse.success(videoService.getVideo(videoId)));
    }
}
