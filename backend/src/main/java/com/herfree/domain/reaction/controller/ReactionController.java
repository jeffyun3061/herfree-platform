package com.herfree.domain.reaction.controller;

import com.herfree.domain.reaction.dto.request.ReactionRequest;
import com.herfree.domain.reaction.dto.response.ReactionResponse;
import com.herfree.domain.reaction.service.ReactionService;
import com.herfree.global.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.herfree.domain.reaction.dto.response.ReactionSummaryResponse;
import com.herfree.domain.reaction.entity.ReactionTargetType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

// 반응은 toggle 방식이므로 POST 단일 엔드포인트로 등록·취소를 모두 처리한다
@RestController
@RequestMapping("/api/reactions")
@RequiredArgsConstructor
public class ReactionController {

    private final ReactionService reactionService;

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<ReactionSummaryResponse>> getSummary(
            @RequestParam ReactionTargetType targetType,
            @RequestParam Long targetId,
            @AuthenticationPrincipal Long userId
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(reactionService.getSummary(targetType, targetId, userId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ReactionResponse>> toggleReaction(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody ReactionRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(reactionService.toggleReaction(userId, request)));
    }
}
