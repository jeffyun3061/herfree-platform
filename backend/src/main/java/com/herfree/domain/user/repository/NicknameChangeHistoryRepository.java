package com.herfree.domain.user.repository;

import com.herfree.domain.user.entity.NicknameChangeHistory;
import com.herfree.domain.user.entity.NicknameChangeType;
import java.time.Instant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NicknameChangeHistoryRepository extends JpaRepository<NicknameChangeHistory, Long> {

    Optional<NicknameChangeHistory> findFirstByUserIdAndChangeTypeAndCreatedAtAfterOrderByCreatedAtDesc(
            Long userId,
            NicknameChangeType changeType,
            Instant createdAt
    );
}
