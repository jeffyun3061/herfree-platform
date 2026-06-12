package com.herfree.domain.reaction.service;

import com.herfree.domain.reaction.dto.request.ReactionRequest;
import com.herfree.domain.reaction.dto.response.ReactionResponse;
import com.herfree.domain.reaction.dto.response.ReactionSummaryResponse;
import com.herfree.domain.reaction.dto.response.ReactionSummaryResponse.ReactionCountItem;
import com.herfree.domain.reaction.entity.Reaction;
import com.herfree.domain.reaction.entity.ReactionTargetType;
import com.herfree.domain.reaction.entity.ReactionType;
import com.herfree.domain.reaction.repository.ReactionRepository;
import java.util.Arrays;
import java.util.List;
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

    // toggle 방식: 이미 반응이 있으면 취소하고, 없으면 등록한다.
    // 별도의 "반응 취소" API를 만들지 않아도 되어 클라이언트-서버 상호작용이 단순해진다.
    @Transactional
    public ReactionResponse toggleReaction(Long userId, ReactionRequest request) {
        boolean alreadyReacted = reactionRepository.existsByUserIdAndTargetTypeAndTargetIdAndReactionType(
                userId, request.targetType(), request.targetId(), request.reactionType());

        boolean reacted;

        if (alreadyReacted) {
            // 기존 반응 취소 — deleteBy... 메서드는 내부적으로 먼저 SELECT 후 DELETE를 실행한다.
            // 삭제 경로에서는 User 엔티티를 조회할 필요가 없으므로, 존재 확인 후 바로 삭제한다.
            reactionRepository.deleteByUserIdAndTargetTypeAndTargetIdAndReactionType(
                    userId, request.targetType(), request.targetId(), request.reactionType());
            reacted = false;
        } else {
            // 신규 등록 경로에서만 User 엔티티를 조회한다.
            // 삭제 시에도 User를 미리 로드하면 불필요한 DB 왕복이 발생하기 때문에 여기로 이동했다.
            User user = userRepository.findById(userId)
                    .orElseThrow(UserNotFoundException::new);
            Reaction reaction = Reaction.builder()
                    .user(user)
                    .targetType(request.targetType())
                    .targetId(request.targetId())
                    .reactionType(request.reactionType())
                    .build();
            reactionRepository.save(reaction);
            reacted = true;
        }

        // 토글 후 해당 타입의 집계 수를 바로 반환해 클라이언트가 재조회 없이 UI를 갱신할 수 있도록 한다.
        // reactionType을 반드시 포함해 집계해야 한다.
        // EMPATHY·COMFORT·HELPFUL 등 서로 다른 타입을 합산하면 "공감해요 N개"가 틀린 값이 된다.
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

    // 대상별 반응 집계 — 초기 UI 표시용. userId가 null이면 reacted는 항상 false다.
    @Transactional(readOnly = true)
    public ReactionSummaryResponse getSummary(
            ReactionTargetType targetType,
            Long targetId,
            Long userId
    ) {
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
