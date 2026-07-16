package com.herfree.domain.user.repository;

import com.herfree.domain.user.entity.NicknameChangeHistory;
import com.herfree.domain.user.entity.NicknameChangeType;
import java.time.Instant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NicknameChangeHistoryRepository extends JpaRepository<NicknameChangeHistory, Long> {

    Optional<NicknameChangeHistory> findFirstByUserIdAndChangeTypeAndCreatedAtAfterOrderByCreatedAtDesc(
            Long userId,
            NicknameChangeType changeType,
            Instant createdAt
    );

    @Modifying(clearAutomatically = true)
    @Query("""
            UPDATE NicknameChangeHistory h
            SET h.oldNickname = 'withdrawn',
                h.newNickname = 'withdrawn'
            WHERE h.user.id = :userId
            """)
    void anonymizeByUserId(@Param("userId") Long userId);
}
