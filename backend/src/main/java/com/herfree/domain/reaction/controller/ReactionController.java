package com.herfree.domain.reaction.controller;

import com.herfree.domain.reaction.dto.request.ReactionRequest;
import com.herfree.domain.reaction.dto.response.ReactionResponse;
import com.herfree.domain.reaction.service.ReactionService;
import com.herfree.global.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// 반응 토글 API — 로그인한 사용자만 반응을 등록·취소할 수 있다.
@RestController
@RequestMapping("/api/reactions")
@RequiredArgsConstructor
public class ReactionController {

    private final ReactionService reactionService;

    @PostMapping
    public ResponseEntity<ApiResponse<ReactionResponse>> toggleReaction(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody ReactionRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(reactionService.toggleReaction(userId, request)));
    }
}
