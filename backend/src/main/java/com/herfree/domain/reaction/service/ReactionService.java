package com.herfree.domain.reaction.service;

import com.herfree.domain.reaction.dto.request.ReactionRequest;
import com.herfree.domain.reaction.dto.response.ReactionResponse;
import com.herfree.domain.reaction.dto.response.ReactionSummaryResponse;
import com.herfree.domain.reaction.dto.response.ReactionSummaryResponse.ReactionCountItem;
import com.herfree.domain.reaction.entity.Reaction;
import com.herfree.domain.reaction.entity.ReactionTargetType;
import com.herfree.domain.reaction.entity.ReactionType;
import com.herfree.domain.reaction.repository.ReactionRepository;
import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.entity.UserRole;
import com.herfree.domain.user.entity.UserStatus;
import com.herfree.domain.user.exception.UserNotFoundException;
import com.herfree.domain.user.repository.UserRepository;
import java.util.Arrays;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 게시글·댓글 반응의 등록, 취소, 집계를 담당한다. */
@Service
@RequiredArgsConstructor
public class ReactionService {

    private final ReactionRepository reactionRepository;
    private final UserRepository userRepository;
    private final ReactionTargetAccessService targetAccessService;

    @Transactional
    public ReactionResponse toggleReaction(Long userId, ReactionRequest request) {
        // 사용자 행을 잠가 같은 계정의 중복 토글 요청이 unique 제약에서 충돌하지 않게 한다.
        User user = userRepository.findByIdAndStatusForUpdate(userId, UserStatus.ACTIVE)
                .orElseThrow(UserNotFoundException::new);
        targetAccessService.assertReadable(
                request.targetType(), request.targetId(), userId, user.getRole());

        boolean alreadyReacted = reactionRepository.existsByUserIdAndTargetTypeAndTargetIdAndReactionType(
                userId, request.targetType(), request.targetId(), request.reactionType());
        boolean reacted;

        if (alreadyReacted) {
            reactionRepository.deleteByUserIdAndTargetTypeAndTargetIdAndReactionType(
                    userId, request.targetType(), request.targetId(), request.reactionType());
            reacted = false;
        } else {
            reactionRepository.save(Reaction.builder()
                    .user(user)
                    .targetType(request.targetType())
                    .targetId(request.targetId())
                    .reactionType(request.reactionType())
                    .build());
            reacted = true;
        }

        long totalCount = reactionRepository.countByTargetTypeAndTargetIdAndReactionType(
                request.targetType(), request.targetId(), request.reactionType());

        return new ReactionResponse(
                request.targetType(),
                request.targetId(),
                request.reactionType(),
                totalCount,
                reacted
        );
    }

    @Transactional(readOnly = true)
    public ReactionSummaryResponse getSummary(
            ReactionTargetType targetType,
            Long targetId,
            Long userId
    ) {
        UserRole viewerRole = userId == null
                ? null
                : userRepository.findById(userId)
                        .map(User::getRole)
                        .orElseThrow(UserNotFoundException::new);
        // 집계 API도 같은 접근 검사를 거쳐 비공개 대상의 반응 수가 새지 않게 한다.
        targetAccessService.assertReadable(targetType, targetId, userId, viewerRole);

        List<ReactionCountItem> counts = Arrays.stream(ReactionType.values())
                .map(type -> {
                    long totalCount = reactionRepository.countByTargetTypeAndTargetIdAndReactionType(
                            targetType, targetId, type);
                    boolean reacted = userId != null
                            && reactionRepository.existsByUserIdAndTargetTypeAndTargetIdAndReactionType(
                                    userId, targetType, targetId, type);
                    return new ReactionCountItem(type, totalCount, reacted);
                })
                .toList();

        return new ReactionSummaryResponse(targetType, targetId, counts);
    }
}
