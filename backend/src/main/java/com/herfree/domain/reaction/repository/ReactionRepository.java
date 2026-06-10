package com.herfree.domain.reaction.repository;

import com.herfree.domain.reaction.entity.Reaction;
import com.herfree.domain.reaction.entity.ReactionTargetType;
import com.herfree.domain.reaction.entity.ReactionType;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReactionRepository extends JpaRepository<Reaction, Long> {

    // 동일 사용자가 동일 대상에 동일 반응을 이미 등록했는지 확인한다 — toggle 로직에 사용
    boolean existsByUserIdAndTargetTypeAndTargetIdAndReactionType(
            Long userId, ReactionTargetType targetType, Long targetId, ReactionType reactionType);

    // toggle 시 기존 반응을 삭제한다 — 반응 취소에 사용
    void deleteByUserIdAndTargetTypeAndTargetIdAndReactionType(
            Long userId, ReactionTargetType targetType, Long targetId, ReactionType reactionType);

    // 특정 대상의 특정 반응 타입 총 개수를 반환한다.
    // target_type + target_id 만으로 집계하면 EMPATHY·COMFORT·HELPFUL 등 서로 다른 타입이 합산되어
    // 클라이언트가 보여줄 "공감해요 N개" 숫자가 틀려진다.
    // 반드시 reaction_type까지 함께 필터링해야 타입별 정확한 집계가 된다.
    long countByTargetTypeAndTargetIdAndReactionType(
            ReactionTargetType targetType, Long targetId, ReactionType reactionType);
}
