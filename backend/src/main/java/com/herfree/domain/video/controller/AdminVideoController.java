package com.herfree.domain.video.controller;

import com.herfree.domain.video.dto.request.VideoCreateRequest;
import com.herfree.domain.video.dto.request.VideoUpdateRequest;
import com.herfree.domain.video.dto.request.VideoVisibilityRequest;
import com.herfree.domain.video.dto.response.VideoResponse;
import com.herfree.domain.video.service.VideoService;
import com.herfree.global.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/videos")
@RequiredArgsConstructor
public class AdminVideoController {

    private final VideoService videoService;

    @PostMapping
    public ResponseEntity<ApiResponse<VideoResponse>> createVideo(
            @Valid @RequestBody VideoCreateRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(videoService.createVideo(request)));
    }

    @PatchMapping("/{videoId}")
    public ResponseEntity<ApiResponse<VideoResponse>> updateVideo(
            @PathVariable Long videoId,
            @Valid @RequestBody VideoUpdateRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(videoService.updateVideo(videoId, request)));
    }

    @PatchMapping("/{videoId}/visibility")
    public ResponseEntity<ApiResponse<VideoResponse>> updateVisibility(
            @PathVariable Long videoId,
            @Valid @RequestBody VideoVisibilityRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(videoService.updateVisibility(videoId, request)));
    }
}
