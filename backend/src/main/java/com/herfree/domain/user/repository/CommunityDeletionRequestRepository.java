package com.herfree.domain.user.repository;
import com.herfree.domain.user.entity.CommunityDeletionRequest;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
public interface CommunityDeletionRequestRepository extends JpaRepository<CommunityDeletionRequest, Long> {
    Optional<CommunityDeletionRequest> findFirstByUserIdOrderByIdDesc(Long userId);
    Page<CommunityDeletionRequest> findAllByOrderByCreatedAtAscIdAsc(Pageable pageable);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from CommunityDeletionRequest r where r.id=:id")
    Optional<CommunityDeletionRequest> findByIdForUpdate(@Param("id") Long id);
}
