package com.herfree.domain.reaction.service;

import com.herfree.domain.reaction.dto.request.ReactionRequest;
import com.herfree.domain.reaction.dto.response.ReactionResponse;
import com.herfree.domain.reaction.entity.Reaction;
import com.herfree.domain.reaction.entity.ReactionTargetType;
import com.herfree.domain.reaction.entity.ReactionType;
import com.herfree.domain.reaction.repository.ReactionRepository;
import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.exception.UserNotFoundException;
import com.herfree.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReactionService {

    private final ReactionRepository reactionRepository;
    private final UserRepository userRepository;

    // 반응 토글 — 이미 등록된 반응이면 취소하고, 없으면 새로 등록한다.
    // 사용자 입장에서 "누르면 켜지고 다시 누르면 꺼진다"는 UX를 서버에서 처리한다.
    @Transactional
    public ReactionResponse toggleReaction(Long userId, ReactionRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(UserNotFoundException::new);

        ReactionTargetType targetType = ReactionTargetType.valueOf(request.targetType().toUpperCase());
        ReactionType reactionType = ReactionType.valueOf(request.reactionType().toUpperCase());

        boolean exists = reactionRepository.existsByUserIdAndTargetTypeAndTargetIdAndReactionType(
                userId, targetType, request.targetId(), reactionType);

        if (exists) {
            // 이미 등록된 반응 — 취소 처리(삭제)
            reactionRepository.deleteByUserIdAndTargetTypeAndTargetIdAndReactionType(
                    userId, targetType, request.targetId(), reactionType);
            return new ReactionResponse(false, request.reactionType(), request.targetId(), request.targetType());
        } else {
            // 미등록 반응 — 새로 추가
            Reaction reaction = Reaction.builder()
                    .user(user)
                    .targetType(targetType)
                    .targetId(request.targetId())
                    .reactionType(reactionType)
                    .build();
            reactionRepository.save(reaction);
            return new ReactionResponse(true, request.reactionType(), request.targetId(), request.targetType());
        }
    }
}
