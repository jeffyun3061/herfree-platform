package com.herfree.domain.reaction.repository;

import com.herfree.domain.reaction.entity.Reaction;
import com.herfree.domain.reaction.entity.ReactionTargetType;
import com.herfree.domain.reaction.entity.ReactionType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReactionRepository extends JpaRepository<Reaction, Long> {

    // 특정 사용자가 특정 대상에 특정 반응을 등록했는지 확인한다.
    // toggleReaction에서 중복 여부를 애플리케이션 레벨에서 먼저 검사하기 위해 사용한다.
    boolean existsByUserIdAndTargetTypeAndTargetIdAndReactionType(
            Long userId, ReactionTargetType targetType, Long targetId, ReactionType reactionType);

    // 반응 취소 시 해당 레코드를 삭제하기 위해 사용한다.
    void deleteByUserIdAndTargetTypeAndTargetIdAndReactionType(
            Long userId, ReactionTargetType targetType, Long targetId, ReactionType reactionType);

    // 특정 대상의 반응 타입별 집계 — 추후 반응 수 표시 API에서 활용 예정
    long countByTargetTypeAndTargetIdAndReactionType(
            ReactionTargetType targetType, Long targetId, ReactionType reactionType);

    Optional<Reaction> findByUserIdAndTargetTypeAndTargetIdAndReactionType(
            Long userId, ReactionTargetType targetType, Long targetId, ReactionType reactionType);
}
